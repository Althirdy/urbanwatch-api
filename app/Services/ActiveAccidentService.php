<?php

namespace App\Services;

use App\Models\Accident;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;

class ActiveAccidentService
{
    /**
     * Get all accidents with "In Progress" or "Ongoing" status for map markers.
     *
     * Returns minimal data (no relationships loaded) for fast initial map load.
     * Only fetches: id, latitude, longitude, accident_type, severity
     * Only shows accidents with published PublicPost.
     *
     * @return Collection Collection of Accident models with minimal data
     */
    public function getInProgressAccidentsForMarkers(): Collection
    {
        $accidents = Accident::whereIn('status', ['In Progress', 'in progress', 'Ongoing'])
            ->whereHas('publicPost', function ($query) {
                $query->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
            })
            ->select(['id', 'latitude', 'longitude', 'accident_type', 'severity'])
            ->orderBy('occurred_at', 'desc')
            ->get();

        Log::info('ActiveAccidentService: Retrieved in-progress accidents for markers', [
            'count' => $accidents->count(),
        ]);

        return $accidents;
    }

    /**
     * Get a single accident by ID with "In Progress" or "Ongoing" status.
     *
     * Loads full relationships based on user role for detailed view.
     * Only shows if associated PublicPost is published.
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
            ->whereIn('status', ['In Progress', 'in progress', 'Ongoing'])
            ->whereHas('publicPost', function ($query) {
                $query->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
            });

        // Load relationships based on role
        if ($roleId === 2) {
            // Role 2: Full access - load CCTV device and media
            $query->with([
                'cctvDevice',
                'media',
            ]);
        } elseif ($roleId === 3) {
            // Role 3: Citizens - load CCTV device for coordinates and media for images
            $query->with(['cctvDevice', 'media']);
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

    /**
     * Get paginated list of accidents with "In Progress" or "Ongoing" status using cursor pagination.
     *
     * Returns full accident data with relationships for list view.
     * Only shows accidents with published PublicPost.
     *
     * @param  int  $perPage  Number of items per page
     * @return CursorPaginator Cursor paginated results
     */
    public function getInProgressAccidentsCursor(int $perPage = 10): CursorPaginator
    {
        $accidents = Accident::whereIn('status', ['In Progress', 'in progress', 'Ongoing'])
            ->whereHas('publicPost', function ($query) {
                $query->whereNotNull('published_at')
                    ->where('published_at', '<=', now());
            })
            ->with(['cctvDevice', 'media'])
            ->orderBy('occurred_at', 'desc')
            ->cursorPaginate($perPage);

        Log::info('ActiveAccidentService: Retrieved cursor-paginated in-progress accidents', [
            'count' => $accidents->count(),
            'per_page' => $perPage,
        ]);

        return $accidents;
    }
}
