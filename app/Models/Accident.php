<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Accident extends Model
{
    protected $fillable = [
        'title',
        'description',
        'latitude',
        'longitude',
        'occurred_at',
        'accident_type',
        'status',
        'severity',
    ];
    
    public function accidentMedia(){
        return $this->hasMany(IncidentMedia::class, 'incident_id', 'id');
    }
}
