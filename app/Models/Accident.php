<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Accident extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'latitude',
        'longitude',
        'occurred_at',
        'accident_type',
        'status',
        'severity',
        'cctv_device_id',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function media()
    {
        return $this->morphMany(IncidentMedia::class, 'source');
    }

    public function cctvDevice()
    {
        return $this->belongsTo(cctvDevices::class, 'cctv_device_id');
    }

    /**
     * Get the public post associated with the accident.
     */
    public function publicPost(): \Illuminate\Database\Eloquent\Relations\MorphOne
    {
        return $this->morphOne(PublicPost::class, 'postable');
    }

    /**
     * Get location coordinates from the related CCTV device.
     *
     * @return array|null Returns ['latitude' => string, 'longitude' => string] or null
     */
    public function getLocationFromDevice()
    {
        if (! $this->cctvDevice) {
            return null;
        }

        return [
            'latitude' => $this->cctvDevice->latitude,
            'longitude' => $this->cctvDevice->longitude,
            'location_name' => $this->cctvDevice->location_name,
            'barangay' => null,
        ];
    }
}
