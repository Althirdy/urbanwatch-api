<?php

namespace App\Models\Citizen;

use App\Models\ConcernDistribution;
use App\Models\ConcernHistory;
use App\Models\IncidentMedia;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Concern extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'citizen_id',
        'tracking_code',
        'title',
        'type',
        'description',
        'category',
        'status',
        'transcript_text',
        'longitude',
        'latitude',
        'address',
        'custom_location',
        'severity',
        'user_selected_category',
        'user_selected_severity',
        'ai_category',
        'ai_severity',
        'ai_confidence',
        'ai_processed_at',
        'parent_concern_id',
        'is_duplicate',
    ];

    protected $casts = [
        'longitude' => 'decimal:7',
        'latitude' => 'decimal:7',
        'ai_processed_at' => 'datetime',
        'is_duplicate' => 'boolean',
    ];

    public function parentConcern()
    {
        return $this->belongsTo(Concern::class, 'parent_concern_id');
    }

    public function duplicates()
    {
        return $this->hasMany(Concern::class, 'parent_concern_id');
    }

    public function media()
    {
        return $this->morphMany(IncidentMedia::class, 'source');
    }

    public function citizen()
    {
        return $this->belongsTo(User::class, 'citizen_id');
    }

    public function distribution()
    {
        return $this->hasOne(ConcernDistribution::class, 'concern_id');
    }

    public function histories()
    {
        return $this->hasMany(ConcernHistory::class, 'concern_id')->orderBy('created_at', 'desc');
    }
}
