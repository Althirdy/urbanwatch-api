<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficialsDetails extends Model
{
    protected $table = 'officials_details';

    protected $fillable = [
        'user_id',
        'id_number',
        'purok_id',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'contact_number',
        'office_address',
        'assigned_brgy',
        'latitude',
        'longitude',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'first_name' => 'encrypted',
        'middle_name' => 'encrypted',
        'last_name' => 'encrypted',
        'contact_number' => 'encrypted',
        'office_address' => 'encrypted',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the purok territory assigned to the official.
     */
    public function purok()
    {
        return $this->belongsTo(Purok::class);
    }
}
