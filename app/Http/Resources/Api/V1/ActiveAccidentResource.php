<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActiveAccidentResource extends JsonResource
{
    /**
     * The user's role ID for conditional data formatting.
     */
    protected int $roleId;

    /**
     * Create a new resource instance.
     *
     * @param  mixed  $resource
     */
    public function __construct($resource, int $roleId = 3)
    {
        parent::__construct($resource);
        $this->roleId = $roleId;
    }

    /**
     * Transform the resource into an array.
     *
     * Role 2: Returns full accident data with coordinates from CCTV location and media
     * Role 3: Returns only coordinates, title, and description
     *
     * Uses camelCase for consistency with frontend TypeScript conventions.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get coordinates from CCTV device's location relationship
        $coordinates = $this->getCoordinatesFromCctvLocation();

        // Base data for both Role 3 (Citizen) and Role 2 (Purok Leader)
        $baseData = [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'latitude' => $coordinates['latitude'],
            'longitude' => $coordinates['longitude'],
            'status' => $this->status,
            'severity' => $this->severity,
            'accidentType' => $this->accident_type,
            'occurredAt' => $this->occurred_at?->toIso8601String(),
            'location' => $this->getLocationDetails(),
            'media' => MediaResource::collection($this->whenLoaded('media')),
        ];

        // Both roles now get the same data including media/images
        return $baseData;
    }

    /**
     * Get coordinates from the CCTV device.
     * Location data is stored directly on the cctvDevices table.
     *
     * @return array{latitude: string|null, longitude: string|null}
     */
    protected function getCoordinatesFromCctvLocation(): array
    {
        $cctvDevice = $this->whenLoaded('cctvDevice');

        // cctvDevices has latitude/longitude directly on the model
        if ($cctvDevice && $cctvDevice->latitude && $cctvDevice->longitude) {
            return [
                'latitude' => $cctvDevice->latitude,
                'longitude' => $cctvDevice->longitude,
            ];
        }

        // Fallback to accident's own coordinates if CCTV device not available
        return [
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }

    /**
     * Get detailed location information from CCTV device.
     * Location data is stored directly on the cctvDevices table.
     * Uses camelCase for frontend consistency.
     */
    protected function getLocationDetails(): ?array
    {
        $cctvDevice = $this->whenLoaded('cctvDevice');

        if (! $cctvDevice) {
            return null;
        }

        // cctvDevices stores location info directly on the model
        return [
            'locationName' => $cctvDevice->location_name,
            'barangay' => null, // Not available on cctvDevices table
            'landmark' => null, // Not available on cctvDevices table
            'latitude' => $cctvDevice->latitude,
            'longitude' => $cctvDevice->longitude,
        ];
    }

    /**
     * Create a collection with role context.
     *
     * @param  mixed  $resource
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public static function collectionWithRole($resource, int $roleId)
    {
        return $resource->map(function ($item) use ($roleId) {
            return new static($item, $roleId);
        });
    }
}
