<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccidentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'accidentType' => $this->accident_type,
            'status' => $this->status,
            'severity' => $this->severity,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'detectedAt' => $this->detected_at?->toISOString(),
            'deviceId' => $this->device_id,
            'confidenceScore' => $this->confidence_score,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
            'media' => MediaResource::collection($this->whenLoaded('media')),
        ];
    }
}
