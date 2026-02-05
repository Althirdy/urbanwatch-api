<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class cctvDevices extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'location_id',
        'device_name',
        'primary_rtsp_url',
        'backup_rtsp_url',
        'rtsp_username',
        'rtsp_password',
        'status',
        'brand',
        'model',
        'resolution',
        'fps',
        'yolo_enabled',
        'installation_date',
    ];

    protected $hidden = [
        'rtsp_password',
    ];

    protected $casts = [
        'yolo_enabled' => 'boolean',
        'installation_date' => 'date',
    ];

    /**
     * Reconstruct the full RTSP URL with credentials.
     */
    public function getFullRtspUrlAttribute(): ?string
    {
        return $this->formatRtspUrl($this->primary_rtsp_url);
    }

    /**
     * Reconstruct the full backup RTSP URL with credentials.
     */
    public function getFullBackupRtspUrlAttribute(): ?string
    {
        return $this->formatRtspUrl($this->backup_rtsp_url);
    }

    /**
     * Helper to format RTSP URL with credentials.
     */
    protected function formatRtspUrl(?string $baseUrl): ?string
    {
        if (! $baseUrl) {
            return null;
        }

        // If credentials are provided, insert them into the URL
        if ($this->rtsp_username && $this->rtsp_password) {
            // Check if URL already has rtsp://
            $url = $baseUrl;
            if (str_starts_with($url, 'rtsp://')) {
                $url = substr($url, 7);
            }

            return "rtsp://{$this->rtsp_username}:{$this->rtsp_password}@{$url}";
        }

        return $baseUrl;
    }

    public function location()
    {
        return $this->belongsTo(Locations::class, 'location_id');
    }

    /**
     * Get all media captured by this CCTV device.
     */
    public function media()
    {
        return $this->morphMany(\App\Models\IncidentMedia::class, 'source');
    }

    /**
     * Get snapshots captured by this device.
     */
    public function snapshots()
    {
        return $this->morphMany(\App\Models\IncidentMedia::class, 'source')
            ->where('source_category', 'device_snapshot');
    }

    /**
     * Get YOLO detections from this device.
     */
    public function detections()
    {
        return $this->morphMany(\App\Models\IncidentMedia::class, 'source')
            ->where('source_category', 'cctv_detection');
    }
}
