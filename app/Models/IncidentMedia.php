<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Citizen\Concern;

class IncidentMedia extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'concern_id',
        'media_type',
        'original_path',
        'blurred_path',
        'public_id',
        'original_filename',
        'file_size',
        'mime_type',
    ];

    public function concern()
    {
        return $this->belongsTo(Concern::class, 'concern_id');
    }
}
