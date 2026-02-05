<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UwDevice extends Model
{
    use SoftDeletes;

    protected $table = 'uw_devices';

    protected $fillable = [
        'device_id',
        'device_name',
        'status',
        'api_token',
        'last_seen_at',
        'custom_address',
        'custom_latitude',
        'custom_longitude',
    ];

    protected $hidden = [
        'api_token',
    ];

    protected $casts = [
        'device_id' => 'string',
        'custom_latitude' => 'decimal:7',
        'custom_longitude' => 'decimal:7',
        'last_seen_at' => 'datetime',
    ];

    /**
     * Appends to be automatically included in model's array/JSON form
     */
    protected $appends = [
        'display_location',
        'latitude',
        'longitude',
        'is_online',
        'anomaly_count',
    ];

    /**
     * Get the anomaly logs for this IoT box.
     */
    public function anomalyLogs()
    {
        return $this->hasMany(AnomalyLog::class, 'iot_box_id');
    }

    /**
     * Get the display location from custom address.
     */
    public function getDisplayLocationAttribute()
    {
        return $this->custom_address ?? 'No location specified';
    }

    /**
     * Get the latitude from custom location.
     */
    public function getLatitudeAttribute()
    {
        return $this->custom_latitude;
    }

    /**
     * Get the longitude from custom location.
     */
    public function getLongitudeAttribute()
    {
        return $this->custom_longitude;
    }

    /**
     * Check if the device is currently online (seen in the last 5 minutes).
     */
    public function getIsOnlineAttribute()
    {
        if (! $this->last_seen_at) {
            return false;
        }

        return $this->last_seen_at->gt(now()->subMinutes(5));
    }

    /**
     * Get the total anomaly count for this device.
     */
    public function getAnomalyCountAttribute()
    {
        return $this->anomalyLogs()->count();
    }
}
