<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConcernResource extends JsonResource
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
            'trackingCode' => $this->tracking_code,
            'title' => $this->title,
            'description' => $this->description, // Shortened key
            'transcriptText' => $this->transcript_text,
            'rejectionReason' => $this->rejection_reason,
            'status' => $this->status,
            'severity' => $this->severity,
            'category' => $this->category,
            'type' => $this->type,
            // AI Category Detection Fields
            'aiCategory' => $this->ai_category,
            'aiSeverity' => $this->ai_severity,
            'aiConfidence' => $this->ai_confidence,
            'coherenceScore' => $this->coherence_score,
            'detailScore' => $this->detail_score,
            'aiProcessedAt' => $this->ai_processed_at?->toIso8601String(),

            // 2. Conditional Location (Only send if latitude exists)
            // Grouping lat/lng is cleaner for Maps API
            'location' => $this->when($this->latitude, [
                'lat' => $this->latitude,
                'lng' => $this->longitude,
            ]),

            // 3. Remove Nulls (Only sends 'address' if it actually has text)
            'address' => $this->whenNotNull($this->address),
            'customLocation' => $this->whenNotNull($this->custom_location),

            // 4. Media Resources
            'media' => MediaResource::collection($this->whenLoaded('media')),

            // 5. Simplify Relationships
            'assignedTo' => $this->whenLoaded('distribution', function () {
                $purokLeader = $this->distribution->purokLeader ?? null;

                if (! $purokLeader) {
                    return null;
                }

                $officialDetails = $purokLeader->officialDetails ?? null;

                return [
                    'name' => $officialDetails
                        ? trim("{$officialDetails->first_name} {$officialDetails->last_name}")
                        : $purokLeader->name,
                    'role' => 'Purok Leader',
                ];
            }),

            'timeline' => $this->whenLoaded('histories', fn () => $this->histories->map(fn ($history) => [
                'id' => $history->id,
                'status' => $history->status,
                'remarks' => $history->remarks,

                // CLEANER: Just call the accessor we made!
                // We flatten it to a single string because the UI usually just needs the name.
                'actor' => $history->actor_display_name,

                // OPTIMIZATION: Remove 'timeAgo'.
                // Send the raw date and let React Native's 'date-fns' handle "5 mins ago".
                // This makes the cache valid for longer.
                'date' => $history->created_at->toIso8601String(),
            ])),

            // 6. Threaded Updates (Duplicates)
            'updates' => $this->whenLoaded('duplicates', fn () => $this->duplicates->map(fn ($duplicate) => [
                'id' => $duplicate->id,
                'title' => $duplicate->title,
                'description' => $duplicate->description,
                'createdAt' => $duplicate->created_at->diffForHumans(),
                // Optimization: Only show media if it was explicitly loaded (i.e., in Detail View)
                'media' => $duplicate->relationLoaded('media')
                    ? MediaResource::collection($duplicate->media)
                    : [],
            ])),

            'createdAt' => $this->created_at->diffForHumans(),
            'duplicatesCount' => $this->duplicates_count ?? $this->duplicates()->count() ?? 0,
            'isDuplicate' => ! is_null($this->parent_concern_id),
        ];
    }
}
