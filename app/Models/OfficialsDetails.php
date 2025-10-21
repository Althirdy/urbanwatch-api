<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficialsDetails extends Model
{
    protected $table = 'officials_details';

    protected $fillable = [
        'user_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'contact_number',
        'office_address',
        'assigned_brgy',
        'latitude',
        'longitude',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
