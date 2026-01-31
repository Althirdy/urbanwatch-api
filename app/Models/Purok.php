<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purok extends Model
{
    protected $fillable = [
        'name',
        'color',
        'boundary',
    ];

    /**
     * Get the officials (leaders) associated with the purok.
     */
    public function officials()
    {
        return $this->hasMany(OfficialsDetails::class);
    }
}
