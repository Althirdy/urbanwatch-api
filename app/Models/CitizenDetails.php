<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CitizenDetails extends Model
{
    protected $table = 'citizen_details';

    protected $fillable = [
        'user_id',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
