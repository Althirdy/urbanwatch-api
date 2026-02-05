<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class AnomalyLog extends Model
{
    use SoftDeletes;

    protected $table = 'anomaly_logs';

    protected $fillable = [
        'device_id',
        'iot_box_id',
        'anomaly_type',
        'image',
        'details',
        'is_confirmed',
        'parent_anomaly_id',
        'is_duplicate',
    ];

    protected $casts = [
        'is_confirmed' => 'boolean',
        'is_duplicate' => 'boolean',
        'details' => 'array',
    ];

    /**
     * Append custom attributes to JSON.
     */
    protected $appends = ['image_url'];

    /**
     * Get the full URL for the image via API proxy (bypasses ngrok browser warning).
     */
    public function getImageUrlAttribute(): ?string
    {
        if (! $this->image) {
            return null;
        }

        // If already a full URL, return as-is
        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        // Return API proxy URL instead of direct storage URL
        // This bypasses ngrok's browser warning for mobile apps
        return url("/api/v1/anomaly-logs/{$this->id}/image");
    }

    /**
     * Get the IoT box (UwDevice) that owns this anomaly log.
     */
    public function iotBox()
    {
        return $this->belongsTo(UwDevice::class, 'iot_box_id');
    }

    /**
     * Get the parent anomaly (if this is a duplicate/follow-up).
     */
    public function parentAnomaly()
    {
        return $this->belongsTo(AnomalyLog::class, 'parent_anomaly_id');
    }

    /**
     * Get all duplicate/related anomalies grouped under this parent.
     */
    public function relatedAnomalies()
    {
        return $this->hasMany(AnomalyLog::class, 'parent_anomaly_id');
    }

    /**
     * Alias for relatedAnomalies (matches concern naming convention).
     */
    public function duplicates()
    {
        return $this->hasMany(AnomalyLog::class, 'parent_anomaly_id');
    }

    /**
     * Get anomaly type label for display.
     */
    public function getAnomalyTypeLabelAttribute(): string
    {
        return match ($this->anomaly_type) {
            'sound_anomaly' => 'Sound Anomaly',
            'anti_tampering' => 'Anti-Tampering Alert',
            default => ucfirst(str_replace('_', ' ', $this->anomaly_type)),
        };
    }

    /**
     * Check if this anomaly is a parent (has related anomalies).
     */
    public function isParent(): bool
    {
        return $this->parent_anomaly_id === null && ! $this->is_duplicate;
    }

    /**
     * Scope for only parent anomalies (non-duplicates).
     */
    public function scopeParentsOnly($query)
    {
        return $query->where('is_duplicate', false);
    }
}
