<?php

namespace App\Http\Controllers\Api\PurokLeader;

use App\Events\ConcernStatusUpdated;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\Api\PurokLeader\AssignedConcernResource;
use App\Jobs\SendConcernStatusNotificationJob;
use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\ConcernHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConcernController extends BaseApiController
{
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
        $request->validate([
            'status' => 'required|in:pending,ongoing,escalated,resolved', // Added resolved to validation
        ]);

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
            $concern->update(['status' => $status]);

            // 2. Update the specific distribution status
            // Mapping statuses if they differ, otherwise usage is direct
            $distributionStatus = match ($status) {
                'pending' => 'assigned',
                'ongoing' => 'in_progress', // Fix: Map 'ongoing' to 'in_progress'
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
                    'acted_by' => auth()->id(), // Recorded as action by the official
                    'status' => $status,
                    'remarks' => "Status mirrored from Parent Concern #{$concern->tracking_code}: {$remarks}",
                ]);

                // Notify the citizen of this duplicate concern
                SendConcernStatusNotificationJob::dispatch(
                    $duplicate,
                    $purokLeader,
                    $previousStatus, // Assuming previous status matches parent, or just 'pending'
                    $status,
                    $remarks
                );
            }

            DB::commit();

            // Trigger event to notify citizen of status update
            event(new ConcernStatusUpdated(
                $concern->fresh(),
                $distribution->fresh(),
                $previousStatus,
                $status,
                $purokLeader,
                $remarks
            ));

            // Dispatch job to send email notification to citizen
            SendConcernStatusNotificationJob::dispatch(
                $concern->fresh(),
                $purokLeader,
                $previousStatus,
                $status,
                $remarks
            );

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
}
