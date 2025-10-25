<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UwDevice extends Model
{
    use SoftDeletes;

    protected $table = 'uw_devices';

    protected $fillable = [
        'device_name',
        'location_id',
        'cctv_id',
        'status',
        'custom_address',
        'custom_latitude',
        'custom_longitude',
    ];

    protected $casts = [
        'custom_latitude' => 'decimal:7',
        'custom_longitude' => 'decimal:7',
    ];

    /**
     * Appends to be automatically included in model's array/JSON form
     */
    protected $appends = [
        'display_location',
        'latitude',
        'longitude',
    ];

    /**
     * Get the location that owns the UW device.
     */
    public function location()
    {
        return $this->belongsTo(Locations::class, 'location_id');
    }

    /**
     * Get the CCTV device associated with this UW device.
     */
    public function cctvDevice()
    {
        return $this->belongsTo(cctvDevices::class, 'cctv_id');
    }

    /**
     * Get the display location (either from location relationship or custom).
     */
    public function getDisplayLocationAttribute()
    {
        if ($this->location) {
            return $this->location->location_name . ', ' . $this->location->barangay;
        }
        return $this->custom_address ?? 'No location specified';
    }

    /**
     * Get the latitude (either from location relationship or custom).
     */
    public function getLatitudeAttribute()
    {
        if ($this->location) {
            return $this->location->latitude;
        }
        return $this->custom_latitude;
    }

    /**
     * Get the longitude (either from location relationship or custom).
     */
    public function getLongitudeAttribute()
    {
        if ($this->location) {
            return $this->location->longitude;
        }
        return $this->custom_longitude;
    }
}
