<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'user_type',
        'type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Notification Types
     */
    public const TYPE_CONCERN_ASSIGNED = 'concern_assigned';

    public const TYPE_CONCERN_ACKNOWLEDGED = 'concern_acknowledged';

    public const TYPE_CONCERN_RESOLVED = 'concern_resolved';

    public const TYPE_CONCERN_REJECTED = 'concern_rejected';

    public const TYPE_CONCERN_STATUS_UPDATE = 'concern_status_update';

    public const TYPE_CONCERN_MERGED = 'concern_merged';

    public const TYPE_NEW_SAFETY_POST = 'new_safety_post';

    public const TYPE_SYSTEM_ANNOUNCEMENT = 'system_announcement';

    // Anomaly Log Types (IoT Box)
    public const TYPE_ANOMALY_DETECTED = 'anomaly_detected';

    public const TYPE_ANOMALY_CONFIRMED = 'anomaly_confirmed';

    /**
     * User Types
     */
    public const USER_TYPE_CITIZEN = 'citizen';

    public const USER_TYPE_PUROK_LEADER = 'purok_leader';

    /**
     * Get the user that owns the notification.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get unread notifications.
     */
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Scope to get read notifications.
     */
    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    /**
     * Scope to get notifications for a specific user type.
     */
    public function scopeForUserType($query, string $userType)
    {
        return $query->where('user_type', $userType);
    }

    /**
     * Mark the notification as read.
     */
    public function markAsRead(): bool
    {
        if ($this->read_at === null) {
            return $this->update(['read_at' => now()]);
        }

        return true;
    }

    /**
     * Check if the notification is read.
     */
    public function isRead(): bool
    {
        return $this->read_at !== null;
    }
}
