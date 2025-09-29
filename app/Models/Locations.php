<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Locations extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'location_category',
        'location_name',
        'landmark',
        'barangay',
        'latitude',
        'longitude',
        'description',
    ];

    public function locationCategory()
    {
        return $this->belongsTo(LocationCategory::class, 'location_category');
    }
}
