<?php

namespace App\Console\Commands;

use App\Events\ConcernStatusUpdated;
use App\Jobs\SendConcernStatusNotificationJob;
use App\Jobs\SendExpoPushNotificationJob;
use App\Models\Citizen\Concern;
use App\Models\ConcernHistory;
use App\Models\Notification;
use App\Services\MailService;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoResolveAwaitingConcerns extends Command
{
    protected $signature = 'concerns:auto-resolve-awaiting {--dry-run : Show affected concerns without applying updates}';

    protected $description = 'Automatically resolve awaiting_confirmation concerns after 2 hours with no citizen response';

    public function handle(NotificationService $notificationService, MailService $mailService): int
    {
        $cutoff = now()->subHours(2);
        $dryRun = (bool) $this->option('dry-run');

        $query = Concern::query()
            ->where('status', 'awaiting_confirmation')
            ->whereNotNull('resolution_requested_at')
            ->where('resolution_requested_at', '<=', $cutoff)
            ->with(['distribution.purokLeader', 'duplicates.distribution']);

        $total = (clone $query)->count();

        $this->info("Found {$total} concern(s) eligible for auto-resolution (cutoff: {$cutoff->toDateTimeString()}).");

        if ($dryRun || $total === 0) {
            return self::SUCCESS;
        }

        $resolvedCount = 0;

        $query->chunkById(100, function ($concerns) use ($notificationService, $mailService, &$resolvedCount, $cutoff) {
            foreach ($concerns as $concern) {
                DB::transaction(function () use ($concern, $notificationService, $mailService, &$resolvedCount, $cutoff) {
                    $lockedConcern = Concern::query()
                        ->whereKey($concern->id)
                        ->where('status', 'awaiting_confirmation')
                        ->whereNotNull('resolution_requested_at')
                        ->where('resolution_requested_at', '<=', $cutoff)
                        ->with(['distribution.purokLeader', 'duplicates.distribution'])
                        ->lockForUpdate()
                        ->first();

                    if (! $lockedConcern) {
                        return;
                    }

                    $previousStatus = 'awaiting_confirmation';
                    $remarks = 'Automatically resolved after 2 hours without citizen confirmation.';

                    $lockedConcern->update([
                        'status' => 'resolved',
                        'resolution_requested_at' => null,
                    ]);

                    $distribution = $lockedConcern->distribution;
                    $statusActor = $distribution?->purokLeader ?? $lockedConcern->citizen;
                    if ($distribution) {
                        $distribution->update(['status' => 'resolved']);
                    }

                    ConcernHistory::create([
                        'concern_id' => $lockedConcern->id,
                        'acted_by' => null,
                        'status' => 'resolved',
                        'remarks' => $remarks,
                    ]);

                    foreach ($lockedConcern->duplicates as $duplicate) {
                        $duplicate->update(['status' => 'resolved']);

                        if ($duplicate->distribution) {
                            $duplicate->distribution->update(['status' => 'resolved']);
                        }

                        ConcernHistory::create([
                            'concern_id' => $duplicate->id,
                            'acted_by' => null,
                            'status' => 'resolved',
                            'remarks' => "Status mirrored from Parent Concern #{$lockedConcern->tracking_code}: {$remarks}",
                        ]);

                        $duplicateNotification = $notificationService->notifyConcernStatusChanged(
                            $duplicate,
                            $previousStatus,
                            'resolved',
                            null,
                            $remarks
                        );

                        $this->dispatchPushNotificationIfNeeded($duplicateNotification);

                        if ($statusActor) {
                            SendConcernStatusNotificationJob::dispatch(
                                $duplicate,
                                $statusActor,
                                $previousStatus,
                                'resolved',
                                $remarks
                            )->afterCommit();
                        }
                    }

                    $citizenNotification = $notificationService->notifyConcernStatusChanged(
                        $lockedConcern,
                        $previousStatus,
                        'resolved',
                        null,
                        $remarks
                    );
                    $this->dispatchPushNotificationIfNeeded($citizenNotification);

                    if ($distribution?->purokLeader) {
                        $leaderNotification = $notificationService->notifyConcernAutoResolvedForPurokLeader(
                            $lockedConcern,
                            $distribution->purokLeader
                        );
                        $this->dispatchPushNotificationIfNeeded($leaderNotification);

                        if (! empty($distribution->purokLeader->email)) {
                            $mailService->sendRawEmail(
                                $distribution->purokLeader->email,
                                'Concern Auto-Resolved',
                                "Concern {$lockedConcern->tracking_code} was automatically resolved after the citizen did not respond within 2 hours."
                            );
                        }

                        event(new ConcernStatusUpdated(
                            $lockedConcern->fresh(),
                            $distribution->fresh(),
                            $previousStatus,
                            'resolved',
                            $distribution->purokLeader,
                            $remarks
                        ));
                    }

                    if ($statusActor) {
                        SendConcernStatusNotificationJob::dispatch(
                            $lockedConcern->fresh(),
                            $statusActor,
                            $previousStatus,
                            'resolved',
                            $remarks
                        )->afterCommit();
                    }

                    $resolvedCount++;
                });
            }
        });

        Log::info('Auto-resolve awaiting confirmation command finished', [
            'resolved_count' => $resolvedCount,
        ]);

        $this->info("Auto-resolved {$resolvedCount} concern(s).");

        return self::SUCCESS;
    }

    private function dispatchPushNotificationIfNeeded(?Notification $notification): void
    {
        if (! $notification) {
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
                'type' => 'concern_status_update',
                'concernId' => (int) ($payload['concern_id'] ?? 0),
            ])
        )->afterCommit();
    }
}
