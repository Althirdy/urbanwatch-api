<?php

namespace App\Services;

use App\Models\OfficialsDetails;
use App\Models\Purok;
use Illuminate\Support\Facades\Log;

class GeographicRoutingService
{
    /**
     * Find the Purok and its assigned leader(s) based on coordinates.
     *
     * @return array|null Returns ['purok' => $purok, 'leader' => $leader] or null if not found.
     */
    public function findPurokLeader(float $latitude, float $longitude): ?array
    {
        try {
            // MySQL/MariaDB spatial query Point-in-Polygon
            // Note: Point is (longitude, latitude) in ST_GeomFromText/POINT
            $purok = Purok::whereRaw('ST_Contains(boundary, POINT(?, ?))', [$longitude, $latitude])
                ->first();

            if (! $purok) {
                return null;
            }

            // Retrieve the first active leader assigned to this purok
            $leader = OfficialsDetails::where('purok_id', $purok->id)
                ->where('status', 'active')
                ->first();

            return [
                'purok' => $purok,
                'leader' => $leader, // May be null if no leader is assigned yet
            ];
        } catch (\Exception $e) {
            Log::error("Spatial Routing Error (Lat: {$latitude}, Lng: {$longitude}): ".$e->getMessage());

            return null;
        }
    }
}
