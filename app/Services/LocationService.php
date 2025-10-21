<?php

namespace App\Services;

use App\Models\Locations;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LocationService
{
    /**
     * Create a new location
     */
    public function createLocation(array $data): Locations
    {
        try {
            return DB::transaction(function () use ($data) {
                $location = Locations::create($data);
                
                // Add any additional business logic here
                // e.g., logging, notifications, cache invalidation, etc.
                Log::info('Location created successfully', ['location_id' => $location->id]);
                
                return $location;
            });
        } catch (\Exception $e) {
            Log::error('Failed to create location', [
                'error' => $e->getMessage(),
                'data' => $data
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing location
     */
    public function updateLocation(Locations $location, array $data): Locations
    {
        try {
            return DB::transaction(function () use ($location, $data) {
                $location->update($data);
                
                // Add any additional business logic here
                Log::info('Location updated successfully', ['location_id' => $location->id]);
                
                return $location->fresh();
            });
        } catch (\Exception $e) {
            Log::error('Failed to update location', [
                'error' => $e->getMessage(),
                'location_id' => $location->id,
                'data' => $data
            ]);
            throw $e;
        }
    }

    /**
     * Delete a location
     */
    public function deleteLocation(Locations $location): bool
    {
        try {
            return DB::transaction(function () use ($location) {
                $locationId = $location->id;
                
                // Add any cleanup logic here
                // e.g., delete related records, files, etc.
                
                $result = $location->delete();
                
                Log::info('Location deleted successfully', ['location_id' => $locationId]);
                
                return $result;
            });
        } catch (\Exception $e) {
            Log::error('Failed to delete location', [
                'error' => $e->getMessage(),
                'location_id' => $location->id
            ]);
            throw $e;
        }
    }

    /**
     * Get location with relationships
     */
    public function getLocationWithDetails(Locations $location): Locations
    {
        return $location->load('locationCategory');
    }

    /**
     * Get all locations with optional filters
     */
    public function getLocations(array $filters = []): Collection
    {
        $query = Locations::with('locationCategory');

        // Add filters if needed
        if (isset($filters['category_id'])) {
            $query->where('location_category_id', $filters['category_id']);
        }

        if (isset($filters['barangay'])) {
            $query->where('barangay', $filters['barangay']);
        }

        return $query->get();
    }
}