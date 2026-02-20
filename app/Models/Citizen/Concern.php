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
        'specific_type',
        'status',
        'resolution_requested_at',
        'resolution_confirmed_at',
        'transcript_text',
        'longitude',
        'latitude',
        'address',
        'custom_location',
        'severity',
        'ai_category',
        'ai_severity',
        'ai_confidence',
        'coherence_score',
        'detail_score',
        'ai_processed_at',
        'parent_concern_id',
        'followups_count',
        'last_followup_at',
        'last_digest_notified_at',
        'last_digest_count',
        'rejection_reason',
        'is_valid',
        'ai_analysis_raw',
    ];

    protected $casts = [
        'longitude' => 'decimal:7',
        'latitude' => 'decimal:7',
        'ai_confidence' => 'decimal:2',
        'coherence_score' => 'decimal:2',
        'detail_score' => 'decimal:2',
        'ai_processed_at' => 'datetime',
        'resolution_requested_at' => 'datetime',
        'resolution_confirmed_at' => 'datetime',
        'followups_count' => 'integer',
        'last_followup_at' => 'datetime',
        'last_digest_notified_at' => 'datetime',
        'last_digest_count' => 'integer',
        'is_valid' => 'boolean',
        'ai_analysis_raw' => 'array',
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
