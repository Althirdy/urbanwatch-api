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
        'status',
        'brand',
        'model',
        'resolution',
        'fps',
        'installation_date',
    ];

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
