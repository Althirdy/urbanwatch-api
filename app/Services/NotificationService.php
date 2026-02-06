<?php

namespace App\Services;

use App\Jobs\SendSystemAnnouncementJob;
use App\Models\AnomalyLog;
use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\Notification;
use App\Models\PublicPost;
use App\Models\Purok;
use App\Models\User;
use App\Models\UwDevice;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a notification when a concern is assigned to a purok leader.
     */
    public function notifyConcernAssigned(Concern $concern, ConcernDistribution $distribution): ?Notification
    {
        try {
            $purokLeaderId = $distribution->purok_leader_id;

            Log::info('Creating notification for concern assignment', [
                'concern_id' => $concern->id,
                'purok_leader_id' => $purokLeaderId,
            ]);

            $notification = Notification::create([
                'user_id' => $purokLeaderId,
                'user_type' => Notification::USER_TYPE_PUROK_LEADER,
                'type' => Notification::TYPE_CONCERN_ASSIGNED,
                'title' => 'New Concern Assigned',
                'message' => "A new {$concern->category} concern has been assigned to you: {$concern->title}",
                'data' => [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'category' => $concern->category,
                    'severity' => $concern->severity,
                    'address' => $concern->address,
                ],
            ]);

            Log::info('Notification created successfully', [
                'notification_id' => $notification->id,
            ]);

            return $notification;
        } catch (\Exception $e) {
            Log::error('Failed to create concern_assigned notification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'concern_id' => $concern->id,
                'purok_leader_id' => $distribution->purok_leader_id,
            ]);

            return null;
        }
    }

    /**
     * Create a notification when a purok leader acknowledges a concern.
     */
    public function notifyConcernAcknowledged(Concern $concern, User $purokLeader, ?string $remarks = null): ?Notification
    {
        try {
            $citizenId = $concern->citizen_id;

            return Notification::create([
                'user_id' => $citizenId,
                'user_type' => Notification::USER_TYPE_CITIZEN,
                'type' => Notification::TYPE_CONCERN_ACKNOWLEDGED,
                'title' => 'Concern Acknowledged',
                'message' => "Your concern ({$concern->tracking_code}) has been acknowledged by the Purok Leader.",
                'data' => [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'acknowledged_by' => $purokLeader->name ?? 'Purok Leader',
                    'remarks' => $remarks,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create concern_acknowledged notification', [
                'error' => $e->getMessage(),
                'concern_id' => $concern->id,
            ]);

            return null;
        }
    }

    /**
     * Create a notification when a concern is resolved.
     */
    public function notifyConcernResolved(Concern $concern, User $purokLeader, ?string $remarks = null): ?Notification
    {
        try {
            $citizenId = $concern->citizen_id;

            return Notification::create([
                'user_id' => $citizenId,
                'user_type' => Notification::USER_TYPE_CITIZEN,
                'type' => Notification::TYPE_CONCERN_RESOLVED,
                'title' => 'Concern Resolved',
                'message' => "Your concern ({$concern->tracking_code}) has been resolved.",
                'data' => [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'resolved_by' => $purokLeader->name ?? 'Purok Leader',
                    'remarks' => $remarks,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create concern_resolved notification', [
                'error' => $e->getMessage(),
                'concern_id' => $concern->id,
            ]);

            return null;
        }
    }

    /**
     * Create a notification when a concern status changes.
     */
    public function notifyConcernStatusChanged(
        Concern $concern,
        string $previousStatus,
        string $newStatus,
        User $actor,
        ?string $remarks = null
    ): ?Notification {
        try {
            // Notify the citizen who submitted the concern
            $citizenId = $concern->citizen_id;

            // Determine notification type based on new status
            $type = match ($newStatus) {
                'acknowledged' => Notification::TYPE_CONCERN_ACKNOWLEDGED,
                'resolved' => Notification::TYPE_CONCERN_RESOLVED,
                'rejected' => Notification::TYPE_CONCERN_REJECTED,
                default => Notification::TYPE_CONCERN_STATUS_UPDATE,
            };

            // Determine status label and message
            [$statusLabel, $message] = match ($newStatus) {
                'rejected' => [
                    'Rejected',
                    "Your concern ({$concern->tracking_code}) has been reviewed and marked as invalid.",
                ],
                default => [
                    ucfirst(str_replace('_', ' ', $newStatus)),
                    "Your concern ({$concern->tracking_code}) status has been updated to ".ucfirst(str_replace('_', ' ', $newStatus)).'.',
                ],
            };

            return Notification::create([
                'user_id' => $citizenId,
                'user_type' => Notification::USER_TYPE_CITIZEN,
                'type' => $type,
                'title' => "Concern Status: {$statusLabel}",
                'message' => $message,
                'data' => [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'updated_by' => $actor->name ?? 'Official',
                    'remarks' => $remarks,
                    'rejection_reason' => $newStatus === 'rejected' ? $remarks : null,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create concern_status_update notification', [
                'error' => $e->getMessage(),
                'concern_id' => $concern->id,
            ]);

            return null;
        }
    }

    /**
     * Create a notification when a concern is merged as a duplicate.
     */
    public function notifyConcernMerged(Concern $duplicate, Concern $parent): ?Notification
    {
        try {
            $citizenId = $duplicate->citizen_id;

            return Notification::create([
                'user_id' => $citizenId,
                'user_type' => Notification::USER_TYPE_CITIZEN,
                'type' => Notification::TYPE_CONCERN_MERGED,
                'title' => 'Concern Merged',
                'message' => "Your concern has been merged with an existing report ({$parent->tracking_code}). You'll receive updates for the combined report.",
                'data' => [
                    'concern_id' => $duplicate->id,
                    'tracking_code' => $duplicate->tracking_code,
                    'parent_concern_id' => $parent->id,
                    'parent_tracking_code' => $parent->tracking_code,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create concern_merged notification', [
                'error' => $e->getMessage(),
                'concern_id' => $duplicate->id,
            ]);

            return null;
        }
    }

    /**
     * Create notifications for a new public safety post.
     * Notifies all citizens in the affected area.
     */
    public function notifyNewPublicPost(PublicPost $post, Collection $users): int
    {
        $count = 0;

        try {
            $notifications = [];
            $now = now();

            foreach ($users as $user) {
                // Determine user type based on role (Role 2 = Purok Leader)
                $userType = $user->role_id === 2
                    ? Notification::USER_TYPE_PUROK_LEADER
                    : Notification::USER_TYPE_CITIZEN;

                $notifications[] = [
                    'user_id' => $user->id,
                    'user_type' => $userType,
                    'type' => Notification::TYPE_NEW_SAFETY_POST,
                    'title' => 'Safety Alert: '.$post->title,
                    'message' => $post->excerpt ?? substr($post->content, 0, 100).'...',
                    'data' => json_encode([
                        'post_id' => $post->id,
                        'category' => $post->category,
                    ]),
                    'read_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Bulk insert for efficiency
            if (count($notifications) > 0) {
                // Insert in chunks to avoid memory issues
                foreach (array_chunk($notifications, 100) as $chunk) {
                    DB::table('notifications')->insert($chunk);
                    $count += count($chunk);
                }
            }

            Log::info('Created notifications for new public post', [
                'post_id' => $post->id,
                'notification_count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create public post notifications', [
                'error' => $e->getMessage(),
                'post_id' => $post->id,
            ]);
        }

        return $count;
    }

    /**
     * Create a system announcement notification for all users.
     * Dispatches a queued job to handle bulk notifications asynchronously.
     *
     * @param  string  $title  The announcement title
     * @param  string  $message  The announcement message
     * @param  string|null  $userType  Filter by user type (citizen/purok_leader) or null for all
     * @param  array|null  $data  Additional data to include
     */
    public function createSystemAnnouncement(
        string $title,
        string $message,
        ?string $userType = null,
        ?array $data = null
    ): void {
        // Dispatch job to process notifications asynchronously
        // This prevents blocking the HTTP request when notifying 1000+ users
        SendSystemAnnouncementJob::dispatch($title, $message, $userType, $data);

        Log::info('System announcement job dispatched', [
            'title' => $title,
            'user_type' => $userType ?? 'all',
        ]);
    }

    /**
     * Get paginated notifications for a user.
     */
    public function getUserNotifications(int $userId, string $userType, int $perPage = 20)
    {
        return Notification::where('user_id', $userId)
            ->where('user_type', $userType)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(int $userId, string $userType): int
    {
        return Notification::where('user_id', $userId)
            ->where('user_type', $userType)
            ->unread()
            ->count();
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(int $notificationId, int $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->first();

        if (! $notification) {
            return false;
        }

        return $notification->markAsRead();
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(int $userId, string $userType): int
    {
        return Notification::where('user_id', $userId)
            ->where('user_type', $userType)
            ->unread()
            ->update(['read_at' => now()]);
    }

    /**
     * Delete a notification.
     */
    public function deleteNotification(int $notificationId, int $userId): bool
    {
        return Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    /**
     * Clear all notifications for a user.
     */
    public function clearAllNotifications(int $userId, string $userType): int
    {
        return Notification::where('user_id', $userId)
            ->where('user_type', $userType)
            ->delete();
    }

    /**
     * Create notification for the purok leader whose territory contains the IoT box location.
     * Strategy:
     * 1. Try to find purok leaders via IoT device's location relationship
     * 2. Fall back to spatial query using device coordinates
     * 3. As last resort, notify all active purok leaders
     */
    public function notifyAnomalyDetected(AnomalyLog $anomalyLog, UwDevice $iotBox): int
    {
        $count = 0;

        try {
            // Load the location relationship if not already loaded
            $iotBox->load('location');

            $purokLeaders = collect();

            // Strategy 1: Try to find purok leaders via device's location
            if ($iotBox->location_id && $iotBox->location) {
                Log::info('Attempting to find purok leaders via location relationship', [
                    'anomaly_log_id' => $anomalyLog->id,
                    'iot_box_id' => $iotBox->id,
                    'location_id' => $iotBox->location_id,
                    'location_name' => $iotBox->location->location_name ?? 'Unknown',
                ]);

                // Try to find purok based on location's coordinates using spatial query
                $latitude = $iotBox->location->latitude;
                $longitude = $iotBox->location->longitude;

                if ($latitude && $longitude) {
                    $purok = Purok::whereRaw('ST_Contains(boundary, POINT(?, ?))', [$longitude, $latitude])
                        ->first();

                    if ($purok) {
                        $purokLeaders = User::where('role_id', 2)
                            ->whereHas('officialDetails', function ($query) use ($purok) {
                                $query->where('status', 'active')
                                    ->where('purok_id', $purok->id);
                            })
                            ->get();

                        Log::info('Found purok leaders via location coordinates', [
                            'purok_id' => $purok->id,
                            'purok_name' => $purok->name,
                            'leader_count' => $purokLeaders->count(),
                        ]);
                    }
                }
            }

            // Strategy 2: Fall back to device's direct coordinates if Strategy 1 failed
            if ($purokLeaders->isEmpty()) {
                $latitude = $iotBox->latitude;
                $longitude = $iotBox->longitude;

                if ($latitude && $longitude) {
                    Log::info('Attempting to find purok via device coordinates', [
                        'anomaly_log_id' => $anomalyLog->id,
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                    ]);

                    $purok = Purok::whereRaw('ST_Contains(boundary, POINT(?, ?))', [$longitude, $latitude])
                        ->first();

                    if ($purok) {
                        $purokLeaders = User::where('role_id', 2)
                            ->whereHas('officialDetails', function ($query) use ($purok) {
                                $query->where('status', 'active')
                                    ->where('purok_id', $purok->id);
                            })
                            ->get();

                        Log::info('Found purok leaders via device coordinates', [
                            'purok_id' => $purok->id,
                            'purok_name' => $purok->name,
                            'leader_count' => $purokLeaders->count(),
                        ]);
                    }
                }
            }

            // Strategy 3: Last resort - notify ALL active purok leaders
            if ($purokLeaders->isEmpty()) {
                Log::warning('Could not determine specific purok, notifying all active purok leaders', [
                    'anomaly_log_id' => $anomalyLog->id,
                    'iot_box_id' => $iotBox->id,
                ]);

                $purokLeaders = User::where('role_id', 2)
                    ->whereHas('officialDetails', function ($query) {
                        $query->where('status', 'active');
                    })
                    ->get();
            }

            if ($purokLeaders->isEmpty()) {
                Log::warning('No active purok leaders found at all', [
                    'anomaly_log_id' => $anomalyLog->id,
                ]);

                return 0;
            }

            $anomalyTypeLabel = $this->getAnomalyTypeLabel($anomalyLog->anomaly_type);
            $locationName = $iotBox->display_location ?? 'Unknown Location';
            $now = now();

            $notifications = [];

            foreach ($purokLeaders as $purokLeader) {
                $notifications[] = [
                    'user_id' => $purokLeader->id,
                    'user_type' => Notification::USER_TYPE_PUROK_LEADER,
                    'type' => Notification::TYPE_ANOMALY_DETECTED,
                    'title' => "IoT Alert: {$anomalyTypeLabel}",
                    'message' => "{$anomalyTypeLabel} detected at {$locationName} by {$iotBox->device_name}.",
                    'data' => json_encode([
                        'anomaly_log_id' => $anomalyLog->id,
                        'anomaly_type' => $anomalyLog->anomaly_type,
                        'anomaly_type_label' => $anomalyTypeLabel,
                        'device_id' => $anomalyLog->device_id,
                        'iot_box_id' => $iotBox->id,
                        'device_name' => $iotBox->device_name,
                        'location' => $locationName,
                        'location_id' => $iotBox->location_id,
                        'latitude' => $iotBox->latitude,
                        'longitude' => $iotBox->longitude,
                        'image' => $anomalyLog->image,
                        'details' => $anomalyLog->details,
                    ]),
                    'read_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Bulk insert for efficiency
            if (count($notifications) > 0) {
                foreach (array_chunk($notifications, 100) as $chunk) {
                    DB::table('notifications')->insert($chunk);
                    $count += count($chunk);
                }
            }

            Log::info('Created notifications for anomaly detection', [
                'anomaly_log_id' => $anomalyLog->id,
                'anomaly_type' => $anomalyLog->anomaly_type,
                'notification_count' => $count,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create anomaly detection notifications', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'anomaly_log_id' => $anomalyLog->id,
            ]);
        }

        return $count;
    }

    /**
     * Create a notification when an anomaly log is confirmed.
     * Optionally notify specific users or broadcast to all purok leaders.
     */
    public function notifyAnomalyConfirmed(AnomalyLog $anomalyLog, User $confirmedBy): int
    {
        $count = 0;

        try {
            $iotBox = $anomalyLog->iotBox;
            $anomalyTypeLabel = $this->getAnomalyTypeLabel($anomalyLog->anomaly_type);
            $locationName = $iotBox?->display_location ?? 'Unknown Location';
            $now = now();

            // Get all active purok leaders to notify about confirmation
            $purokLeaders = User::where('role_id', 2)
                ->where('id', '!=', $confirmedBy->id) // Don't notify the one who confirmed
                ->whereHas('officialDetails', function ($query) {
                    $query->where('status', 'active');
                })
                ->get();

            $notifications = [];

            foreach ($purokLeaders as $purokLeader) {
                $notifications[] = [
                    'user_id' => $purokLeader->id,
                    'user_type' => Notification::USER_TYPE_PUROK_LEADER,
                    'type' => Notification::TYPE_ANOMALY_CONFIRMED,
                    'title' => 'Anomaly Confirmed',
                    'message' => "{$anomalyTypeLabel} at {$locationName} has been confirmed by {$confirmedBy->name}.",
                    'data' => json_encode([
                        'anomaly_log_id' => $anomalyLog->id,
                        'anomaly_type' => $anomalyLog->anomaly_type,
                        'anomaly_type_label' => $anomalyTypeLabel,
                        'iot_box_id' => $iotBox?->id,
                        'device_name' => $iotBox?->device_name,
                        'location' => $locationName,
                        'confirmed_by' => $confirmedBy->name,
                        'confirmed_by_id' => $confirmedBy->id,
                    ]),
                    'read_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Bulk insert
            if (count($notifications) > 0) {
                foreach (array_chunk($notifications, 100) as $chunk) {
                    DB::table('notifications')->insert($chunk);
                    $count += count($chunk);
                }
            }

            Log::info('Created notifications for anomaly confirmation', [
                'anomaly_log_id' => $anomalyLog->id,
                'confirmed_by' => $confirmedBy->id,
                'notification_count' => $count,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create anomaly confirmation notifications', [
                'error' => $e->getMessage(),
                'anomaly_log_id' => $anomalyLog->id,
            ]);
        }

        return $count;
    }

    /**
     * Get human-readable label for anomaly type.
     */
    private function getAnomalyTypeLabel(string $type): string
    {
        return match ($type) {
            'sound_anomaly' => 'Sound Anomaly',
            'anti_tampering' => 'Anti-Tampering Alert',
            default => ucfirst(str_replace('_', ' ', $type)),
        };
    }
}
