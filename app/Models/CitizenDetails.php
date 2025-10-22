<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CitizenDetails extends Model
{
    use HasFactory;

    protected $table = 'citizen_details';

    protected $fillable = [
        'user_id',
        'national_id',
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
        'status',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_verified' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
