<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
    ];

    protected $casts = [
        'is_confirmed' => 'boolean',
        'details' => 'array',
    ];

    /**
     * Get the IoT box (UwDevice) that owns this anomaly log.
     */
    public function iotBox()
    {
        return $this->belongsTo(UwDevice::class, 'iot_box_id');
    }
}
