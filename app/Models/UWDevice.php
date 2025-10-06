<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UWDevice extends Model
{
    use SoftDeletes;

    protected $table = 'uw_devices';

    protected $fillable = [
        'location_id',
        'device_name',
        'status',
        'custom_address',
        'latitude',
        'longitude',
        'cctv_id',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    /**
     * Get the location that owns the UW device.
     */
    public function location()
    {
        return $this->belongsTo(Locations::class, 'location_id');
    }

    /**
     * Get the CCTV camera linked to this UW device.
     */
    public function cctvCamera()
    {
        return $this->belongsTo(cctvDevices::class, 'cctv_id');
    }

    /**
     * Scope to get only active devices.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get only inactive devices.
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * Scope to get devices in maintenance.
     */
    public function scopeMaintenance($query)
    {
        return $query->where('status', 'maintenance');
    }
}