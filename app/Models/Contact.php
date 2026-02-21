<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'branch_unit_name',
        'contact_person',
        'responder_type',
        'primary_mobile',
        'backup_mobile',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Scope for active contacts only
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope for filtering by responder type
     */
    public function scopeByResponderType($query, $type)
    {
        return $query->where('responder_type', $type);
    }

    /**
     * Scope for searching contacts
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('branch_unit_name', 'like', "%{$term}%")
                ->orWhere('contact_person', 'like', "%{$term}%")
                ->orWhere('primary_mobile', 'like', "%{$term}%")
                ->orWhere('backup_mobile', 'like', "%{$term}%");
        });
    }
}
