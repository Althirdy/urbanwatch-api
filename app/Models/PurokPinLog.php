<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurokPinLog extends Model
{
    const UPDATED_AT = null; // Logs are immutable, no updated_at needed

    protected $fillable = [
        'purok_leader_id',
        'reset_by_operator_id',
        'reason',
        'is_default',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'is_default' => 'boolean',
    ];

    /**
     * The Purok Leader whose PIN was reset.
     */
    public function purokLeader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'purok_leader_id');
    }

    /**
     * The Operator who reset the PIN.
     */
    public function resetByOperator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reset_by_operator_id');
    }

    /**
     * Get the formatted operator name who reset the PIN.
     */
    public function getResetByOperatorNameAttribute(): string
    {
        $operator = $this->resetByOperator;
        if ($operator && $operator->officialDetails) {
            $details = $operator->officialDetails;

            return trim("{$details->first_name} {$details->middle_name} {$details->last_name}");
        }

        return $operator->name ?? 'Unknown';
    }
}
