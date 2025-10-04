<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'branch_unit_name',
        'contact_person',
        'responder_type',
        'location',
        'primary_mobile',
        'backup_mobile',
        'latitude',
        'longitude',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
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
        return $query->where(function($q) use ($term) {
            $q->where('branch_unit_name', 'like', "%{$term}%")
              ->orWhere('contact_person', 'like', "%{$term}%")
              ->orWhere('primary_mobile', 'like', "%{$term}%")
              ->orWhere('location', 'like', "%{$term}%");
        });
    }
}