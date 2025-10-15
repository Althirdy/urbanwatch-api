<?php

namespace App\Models\Citizen;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\IncidentMedia;
use App\Models\User;

class Concern extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'citizen_id',
        'title',
        'type',
        'description',
        'category',
        'status',
        'transcript_text',
        'longitude',
        'latitude',
    ];

    protected $casts = [
        'longitude' => 'decimal:7',
        'latitude' => 'decimal:7',
    ];

    public function media()
    {
        return $this->hasMany(IncidentMedia::class, 'concern_id');
    }

    public function citizen()
    {
        return $this->belongsTo(User::class, 'citizen_id');
    }
}
