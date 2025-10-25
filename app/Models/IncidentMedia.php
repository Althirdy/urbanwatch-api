<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Citizen\Concern;

class IncidentMedia extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'source_type',
        'source_id',
        'source_category',
        'media_type',
        'original_path',
        'blurred_path',
        'public_id',
        'original_filename',
        'file_size',
        'mime_type',
        'detection_metadata',
        'device_identifier',
        'captured_at',
    ];

    protected $casts = [
        'detection_metadata' => 'json',
        'captured_at' => 'datetime',
    ];

    /**
     * Get the owning source model (polymorphic relationship).
     */
    public function source()
    {
        return $this->morphTo();
    }

    /**
     * Legacy relationship for concerns (for backward compatibility).
     */
    public function concern()
    {
        return $this->belongsTo(Concern::class, 'source_id')->where('source_type', Concern::class);
    }

    /**
     * Relationship to CCTV devices.
     */
    public function cctvDevice()
    {
        return $this->belongsTo(\App\Models\CctvDevices::class, 'source_id')->where('source_type', \App\Models\CctvDevices::class);
    }

    /**
     * Scope for filtering by source category.
     */
    public function scopeBySourceCategory($query, $category)
    {
        return $query->where('source_category', $category);
    }

    /**
     * Scope for citizen concerns.
     */
    public function scopeCitizenConcerns($query)
    {
        return $query->where('source_category', 'citizen_concern');
    }

    /**
     * Scope for device snapshots.
     */
    public function scopeDeviceSnapshots($query)
    {
        return $query->where('source_category', 'device_snapshot');
    }

    /**
     * Scope for CCTV detections.
     */
    public function scopeCctvDetections($query)
    {
        return $query->where('source_category', 'cctv_detection');
    }

    /**
     * Helper method to create media from a citizen concern.
     */
    public static function createFromConcern($concernId, $mediaData)
    {
        return static::create(array_merge($mediaData, [
            'source_type' => \App\Models\Citizen\Concern::class,
            'source_id' => $concernId,
            'source_category' => 'citizen_concern',
            'captured_at' => now(),
        ]));
    }

    /**
     * Helper method to create media from a device snapshot.
     */
    public static function createFromDeviceSnapshot($deviceId, $mediaData, $deviceIdentifier = null)
    {
        return static::create(array_merge($mediaData, [
            'source_type' => \App\Models\CctvDevices::class,
            'source_id' => $deviceId,
            'source_category' => 'device_snapshot',
            'device_identifier' => $deviceIdentifier,
            'captured_at' => $mediaData['captured_at'] ?? now(),
        ]));
    }

    /**
     * Helper method to create media from YOLO detection.
     */
    public static function createFromYoloDetection($deviceId, $mediaData, $detectionData = [], $deviceIdentifier = null)
    {
        return static::create(array_merge($mediaData, [
            'source_type' => \App\Models\CctvDevices::class,
            'source_id' => $deviceId,
            'source_category' => 'cctv_detection',
            'detection_metadata' => $detectionData,
            'device_identifier' => $deviceIdentifier,
            'captured_at' => $mediaData['captured_at'] ?? now(),
        ]));
    }

    public function accident(){
        return $this->belongsTo(Accident::class, 'source_id', 'id');
    }
}
