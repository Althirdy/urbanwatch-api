<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LocationCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    // Define the relationship with the Location model
    public function locations()
    {
        return $this->hasMany(Locations::class, 'location_category');
    }
}
