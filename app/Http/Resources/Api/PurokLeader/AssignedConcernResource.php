<?php

namespace App\Http\Resources\Api\PurokLeader;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignedConcernResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // $this represents the ConcernDistribution model
        $concern = $this->concern;

        // Return null or empty structure if concern is missing (defensive coding)
        if (! $concern) {
            return [];
        }

        return [
            'id' => $concern->id,
            'distribution_id' => $this->id, // ID from concern_distribution table
            'title' => $concern->title,
            'description' => $concern->description,
            'category' => $concern->category,
            'severity' => $concern->severity,
            'status' => $concern->status, // Global status from concerns table
            'distribution_status' => $this->status, // Status from concern_distribution table
            'latitude' => $concern->latitude,
            'longitude' => $concern->longitude,
            'created_at' => $concern->created_at,
            'updated_at' => $concern->updated_at,

            // Media handling
            'images' => $concern->media
                ->where('source_category', 'citizen_concern')
                ->pluck('original_path')
                ->values()
                ->toArray(),
            'audio' => $concern->media
                ->where('media_type', 'audio')
                ->first()
                ?->original_path,

            // AI Metadata
            'summary' => $concern->summary,
            'transcript' => $concern->transcript_text,

            // Clustering Info
            'related_reports_count' => $concern->duplicates()->count(),

            // Citizen Relationship
            'citizen' => [
                'id' => $concern->citizen->id ?? null,
                'name' => $concern->citizen->name ?? 'Anonymous',
                'phone_number' => $concern->citizen->phone_number ?? null,
            ],
        ];
    }
}
