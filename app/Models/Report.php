<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Report extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'report_type',
        'transcript',
        'description',
        'latitute', // Note: keeping the typo from migration for consistency
        'longtitude', // Note: keeping the typo from migration for consistency
        'is_acknowledge',
        'acknowledge_by',
        'status',
    ];

    protected $casts = [
        'is_acknowledge' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user who created the report.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who acknowledged the report.
     */
    public function acknowledgedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledge_by');
    }

    /**
     * Get the public post associated with this report.
     */
    public function publicPost(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(PublicPost::class);
    }

    /**
     * Get available report types.
     */
    public static function getReportTypes(): array
    {
        return [
            'CCTV',
            'IOT Box',
            'Citizen Concern',
            
        ];
    }

    /**
     * Get available status options.
     */
    public static function getStatusOptions(): array
    {
        return [
            'Pending',
            'Ongoing',
            'Resolved',
            'Archived',
        ];
    }

    /**
     * Check if the report is acknowledged.
     */
    public function isAcknowledged(): bool
    {
        return $this->is_acknowledge === true;
    }

    /**
     * Acknowledge the report.
     */
    public function acknowledge(int $userId): void
    {
        $this->update([
            'is_acknowledge' => true,
            'acknowledge_by' => $userId,
            'status' => 'Ongoing',
        ]);
    }

    /**
     * Resolve the report.
     */
    public function resolve(): void
    {
        $this->update([
            'status' => 'Resolved',
        ]);
    }

    /**
     * Scope to filter by report type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('report_type', $type);
    }

    /**
     * Scope to filter acknowledged reports.
     */
    public function scopeAcknowledged($query, bool $acknowledged = true)
    {
        return $query->where('is_acknowledge', $acknowledged);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Get the report's coordinates as an array.
     */
    public function getCoordinatesAttribute(): array
    {
        return [
            'latitude' => $this->latitute,
            'longitude' => $this->longtitude,
        ];
    }

    /**
     * Get formatted created date.
     */
    public function getFormattedCreatedAtAttribute(): string
    {
        return $this->created_at->format('M d, Y g:i A');
    }

    /**
     * Get the report status with appropriate styling class.
     */
    public function getStatusClassAttribute(): string
    {
        return match ($this->status) {
            'Pending' => 'status-pending',
            'Ongoing' => 'status-ongoing',
            'Resolved' => 'status-resolved',
            'Archived' => 'status-archived',
            default => 'status-default',
        };
    }
}