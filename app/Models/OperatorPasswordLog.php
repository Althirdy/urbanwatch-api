<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperatorPasswordLog extends Model
{
    protected $fillable = [
        'operator_id',
        'changed_by',
        'action',
        'reason',
        'ip_address',
        'user_agent',
    ];

    /**
     * The operator whose password was changed.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    /**
     * The user who made the password change.
     */
    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Get the formatted changed_by name.
     */
    public function getChangedByNameAttribute(): string
    {
        $user = $this->changedByUser;
        if ($user && $user->officialDetails) {
            $details = $user->officialDetails;

            return trim("{$details->first_name} {$details->middle_name} {$details->last_name}");
        }

        return $user->name ?? 'Unknown';
    }
}
