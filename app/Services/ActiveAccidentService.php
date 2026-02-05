<?php

namespace App\Services;

use App\Models\Accident;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

class ActiveAccidentService
{
    /**
     * Get all accidents with "In Progress" status for map markers.
     *
     * Returns minimal data (no relationships loaded) for fast initial map load.
     * Only fetches: id, latitude, longitude, accident_type, severity
     *
     * @return Collection Collection of Accident models with minimal data
     */
    public function getInProgressAccidentsForMarkers(): Collection
    {
        $accidents = Accident::where('status', 'In Progress')
            ->select(['id', 'latitude', 'longitude', 'accident_type', 'severity'])
            ->orderBy('occurred_at', 'desc')
            ->get();

        Log::info('ActiveAccidentService: Retrieved in-progress accidents for markers', [
            'count' => $accidents->count(),
        ]);

        return $accidents;
    }

    /**
     * Get a single accident by ID with "In Progress" status.
     *
     * Loads full relationships based on user role for detailed view.
     * - Role 2: Full data with CCTV location coordinates and media
     * - Role 3: Limited data with coordinates, title, and description only
     *
     * @param  int  $accidentId  The accident ID
     * @param  int  $roleId  The authenticated user's role ID
     * @return Accident|null The accident model or null if not found
     */
    public function getInProgressAccidentById(int $accidentId, int $roleId): ?Accident
    {
        $query = Accident::where('id', $accidentId)
            ->where('status', 'In Progress');

        // Load relationships based on role
        if ($roleId === 2) {
            // Role 2: Full access - load CCTV device and media
            $query->with([
                'cctvDevice',
                'media',
            ]);
        } elseif ($roleId === 3) {
            // Role 3: Limited access - only load CCTV device for coordinates
            $query->with(['cctvDevice']);
        }

        $accident = $query->first();

        if ($accident) {
            Log::info('ActiveAccidentService: Retrieved single in-progress accident', [
                'accident_id' => $accidentId,
                'role_id' => $roleId,
            ]);
        }

        return $accident;
    }
}
