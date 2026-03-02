<?php

namespace App\Http\Controllers\Api\V1\PurokLeader;

use App\Events\ConcernStatusUpdated;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\Api\PurokLeader\AssignedConcernResource;
use App\Jobs\SendConcernStatusNotificationJob;
use App\Jobs\SendExpoPushNotificationJob;
use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\ConcernHistory;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConcernController extends BaseApiController
{
    protected NotificationService $notificationService;

    protected \App\Services\ConcernService $concernService;

    public function __construct(NotificationService $notificationService, \App\Services\ConcernService $concernService)
    {
        $this->notificationService = $notificationService;
        $this->concernService = $concernService;
    }

    /**
     * Display a listing of the assigned concerns.
     */
    public function index()
    {
        try {
            $purokLeaderId = auth()->id();

            // Fetch concerns assigned to this purok leader via ConcernDistribution
            $distributions = ConcernDistribution::where('purok_leader_id', $purokLeaderId)
                ->with(['concern.media', 'concern.citizen']) // Eager load
                ->orderBy('assigned_at', 'desc')
                ->get();

            return $this->sendResponse([
                'concerns' => AssignedConcernResource::collection($distributions),
            ], 'Assigned concerns retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error retrieving assigned concerns', [
                'error' => $e->getMessage(),
                'purok_leader_id' => auth()->id(),
            ]);

            return $this->sendError('Failed to retrieve concerns: '.$e->getMessage());
        }
    }

    /**
     * Display the specified concern.
     */
    public function show(string $id)
    {
        try {
            // Check distribution first to ensure permission
            $distribution = ConcernDistribution::where('concern_id', $id)
                ->where('purok_leader_id', auth()->id())
                ->first();

            if (! $distribution) {
                return $this->sendError('Concern not found or not assigned to you', [], 404);
            }

            // Re-fetch the distribution with relationships to ensure consistency with the Resource
            // Note: We are passing the distribution model to the resource, not just the concern
            $distribution->load(['concern.media', 'concern.citizen']);

            return $this->sendResponse([
                'concern' => new AssignedConcernResource($distribution),
            ], 'Concern details retrieved successfully');
        } catch (\Exception $e) {
            Log::error('Error showing concern', [
                'error' => $e->getMessage(),
                'concern_id' => $id,
            ]);

            return $this->sendError('Failed to retrieve concern details');
        }
    }

    /**
     * Update the status of the concern (and distribution).
     */
    public function update(Request $request, string $id)
    {
        // Log incoming request for debugging
        Log::info('PurokLeader Concern Update Request', [
            'concern_id' => $id,
            'request_data' => $request->all(),
            'status' => $request->input('status'),
            'rejection_reason' => $request->input('rejection_reason'),
            'has_rejection_reason' => $request->has('rejection_reason'),
        ]);

        try {
            $request->validate([
                'status' => 'required|in:pending,ongoing,escalated,resolved,rejected,awaiting_confirmation',
                'rejection_reason' => 'required_if:status,rejected|string|max:500',
                'remarks' => 'nullable|string|max:1000',
            ], [
                'status.required' => 'Status is required',
                'status.in' => 'Status must be one of: pending, ongoing, escalated, resolved, rejected, awaiting_confirmation',
                'rejection_reason.required_if' => 'Rejection reason is required when status is rejected',
                'rejection_reason.string' => 'Rejection reason must be a string',
                'rejection_reason.max' => 'Rejection reason must not exceed 500 characters',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed for concern update', [
                'concern_id' => $id,
                'errors' => $e->errors(),
                'request_data' => $request->all(),
            ]);
            throw $e;
        }

        DB::beginTransaction();
        try {
            // Check distribution permission
            $distribution = ConcernDistribution::where('concern_id', $id)
                ->where('purok_leader_id', auth()->id())
                ->first();

            if (! $distribution) {
                return $this->sendError('Concern not found or not assigned to you', [], 404);
            }

            $status = $request->status;
            $remarks = $request->input('remarks', 'Status updated by Purok Leader');

            // 1. Update the global concern status
            $concern = Concern::find($id);
            $previousStatus = $concern->status;

            // Handle rejection specially (Empowered Purok Leader Rejection)
            if ($status === 'rejected') {
                $rejectionReason = $request->input('rejection_reason', 'Rejected by Purok Leader');
                $this->concernService->rejectConcernByOfficial($concern, $rejectionReason, auth()->user());
                $remarks = "Rejected by Purok Leader: {$rejectionReason}";
            } elseif ($status === 'resolved') {
                // --- Resolve Confirmation Flow ---
                if ($previousStatus === 'awaiting_confirmation') {
                    // Already awaiting — PurokLeader is re-resolving (frontend unlocked the button)
                    $concern->update([
                        'status' => 'resolved',
                        'resolution_requested_at' => null,
                        'resolution_confirmed_at' => null,
                    ]);
                    $remarks = $remarks === 'Status updated by Purok Leader'
                        ? 'Resolved by Purok Leader (citizen did not confirm within the window)'
                        : $remarks;
                } elseif ($previousStatus === 'resolved') {
                    // Already resolved — just updating details/remarks
                    $concern->update(['status' => 'resolved']);
                } else {
                    // First time resolving — set to awaiting_confirmation
                    $status = 'awaiting_confirmation';
                    $concern->update([
                        'status' => 'awaiting_confirmation',
                        'resolution_requested_at' => now(),
                    ]);
                    $remarks = $remarks === 'Status updated by Purok Leader'
                        ? 'Marked for resolution — awaiting citizen confirmation'
                        : $remarks;
                }
            } else {
                $concern->update(['status' => $status]);
            }

            // 2. Update the specific distribution status
            // Mapping statuses if they differ, otherwise usage is direct
            $distributionStatus = match ($status) {
                'pending' => 'assigned',
                'ongoing' => 'in_progress',
                'awaiting_confirmation' => 'awaiting_confirmation',
                default => $status
            };

            // Check if transitioning to a state that implies acknowledgement
            if ($distribution->status === 'assigned' && $distributionStatus !== 'assigned') {
                $distribution->update([
                    'status' => $distributionStatus,
                    'acknowledged_at' => now(),
                ]);
            } else {
                $distribution->update(['status' => $distributionStatus]);
            }

            // 3. Create Audit Log (History)
            ConcernHistory::create([
                'concern_id' => $id,
                'acted_by' => auth()->id(),
                'status' => $status,
                'remarks' => $remarks,
            ]);

            $purokLeader = auth()->user();

            // --- Handle Duplicates / Children ---
            // Automatically update status for all linked duplicates
            foreach ($concern->duplicates as $duplicate) {
                $duplicate->update(['status' => $status]);

                ConcernHistory::create([
                    'concern_id' => $duplicate->id,
                    'acted_by' => auth()->id(),
                    'status' => $status,
                    'remarks' => "Status mirrored from Parent Concern #{$concern->tracking_code}: {$remarks}",
                ]);

                // Notify the citizen of this duplicate concern (in-app + WebSocket + email)
                // 1. In-app notification (database)
                $duplicateNotification = $this->notificationService->notifyConcernStatusChanged(
                    $duplicate,
                    $previousStatus,
                    $status,
                    $purokLeader,
                    "Status mirrored from Parent Concern #{$concern->tracking_code}: {$remarks}"
                );
                $this->dispatchPushNotificationIfNeeded($duplicateNotification, $status);

                // 2. WebSocket broadcast for real-time toast on duplicate's citizen app
                event(new ConcernStatusUpdated(
                    $duplicate->fresh(),
                    $distribution->fresh(), // Use parent's distribution as reference
                    $previousStatus,
                    $status,
                    $purokLeader,
                    "Status mirrored from Parent Concern #{$concern->tracking_code}: {$remarks}"
                ));

                // 3. Email notification via job queue
                if ($this->shouldSendStatusEmail($status)) {
                    SendConcernStatusNotificationJob::dispatch(
                        $duplicate,
                        $purokLeader,
                        $previousStatus,
                        $status,
                        $remarks
                    );
                }
            }

            DB::commit();

            // --- Notify parent concern's citizen ---
            // 1. Create in-app notification (database)
            $parentNotification = $this->notificationService->notifyConcernStatusChanged(
                $concern->fresh(),
                $previousStatus,
                $status,
                $purokLeader,
                $remarks
            );
            $this->dispatchPushNotificationIfNeeded($parentNotification, $status);

            // 2. Broadcast WebSocket event for real-time toast on citizen app
            event(new ConcernStatusUpdated(
                $concern->fresh(),
                $distribution->fresh(),
                $previousStatus,
                $status,
                $purokLeader,
                $remarks
            ));

            // 3. Send email notification via job queue
            if ($this->shouldSendStatusEmail($status)) {
                SendConcernStatusNotificationJob::dispatch(
                    $concern->fresh(),
                    $purokLeader,
                    $previousStatus,
                    $status,
                    $remarks
                );
            }

            return $this->sendResponse([
                'concern_id' => $id,
                'previous_status' => $previousStatus,
                'new_status' => $status,
            ], 'Concern status updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating concern status', [
                'error' => $e->getMessage(),
                'concern_id' => $id,
            ]);

            return $this->sendError('Failed to update concern status: '.$e->getMessage());
        }
    }

    private function shouldSendStatusEmail(string $status): bool
    {
        return in_array($status, ['resolved', 'rejected'], true);
    }

    private function shouldSendPushForStatus(string $status): bool
    {
        return in_array($status, ['ongoing', 'escalated', 'awaiting_confirmation', 'resolved', 'rejected'], true);
    }

    private function dispatchPushNotificationIfNeeded(?Notification $notification, string $status): void
    {
        if (! $notification || ! $this->shouldSendPushForStatus($status)) {
            return;
        }

        $payload = is_array($notification->data) ? $notification->data : [];

        SendExpoPushNotificationJob::dispatch(
            (int) $notification->user_id,
            (string) $notification->user_type,
            (string) $notification->title,
            (string) $notification->message,
            array_merge($payload, [
                'notification_id' => $notification->id,
                'notification_type' => $notification->type,
            ])
        )->afterCommit();
    }
}
