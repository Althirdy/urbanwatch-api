<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CitizenDetails extends Model
{
    protected $table = 'citizen_details';

    protected $fillable = [
        'user_id',
        'pcn_number',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'date_of_birth',
        'phone_number',
        'address',
        'barangay',
        'city',
        'province',
        'postal_code',
        'is_verified',
    ];

    protected $casts = [
        'first_name' => 'encrypted',
        'middle_name' => 'encrypted',
        'last_name' => 'encrypted',
        'phone_number' => 'encrypted',
        'address' => 'encrypted',
        'is_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
