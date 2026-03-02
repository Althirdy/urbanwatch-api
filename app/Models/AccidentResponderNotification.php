<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccidentResponderNotification extends Model
{
    protected $fillable = [
        'accident_id',
        'incident_class',
        'contact_id',
        'phone_used',
        'send_target',
        'status',
        'provider_response',
        'sent_at',
    ];

    protected $casts = [
        'provider_response' => 'array',
        'sent_at' => 'datetime',
    ];

    public function accident()
    {
        return $this->belongsTo(Accident::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
