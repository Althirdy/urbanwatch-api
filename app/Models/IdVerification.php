<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IdVerification extends Model
{
    protected $fillable = [
        'verification_id',
        'status',
        'image_disk',
        'image_path',
        'result_json',
        'confidence',
        'flags',
        'failure_reason',
        'request_ip',
        'device_fingerprint',
        'expires_at',
        'processed_at',
        'deleted_image_at',
    ];

    protected $casts = [
        'result_json' => 'array',
        'flags' => 'array',
        'expires_at' => 'datetime',
        'processed_at' => 'datetime',
        'deleted_image_at' => 'datetime',
    ];
}
