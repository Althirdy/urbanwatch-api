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
}
