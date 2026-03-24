<?php

namespace App\Http\Resources\Api\PurokLeader;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssignedConcernResource extends JsonResource
{
    /**
     * Build media payload for concerns where mobile expects mixed URLs in images[]
     * while keeping explicit video fields for backward compatibility.
     *
     * @param  \Illuminate\Support\Collection<int, mixed>  $mediaCollection
     * @return array{images: array<int, string>, videos: array<int, string>, video: ?string, video_url: ?string, audio: ?string}
     */
    private function buildMediaPayload($mediaCollection): array
    {
        $citizenMedia = $mediaCollection
            ->where('source_category', 'citizen_concern')
            ->filter(fn ($media) => ! empty($media->original_path));

        $isVideoMedia = function ($media): bool {
            $mediaType = strtolower((string) ($media->media_type ?? ''));
            if ($mediaType === 'video') {
                return true;
            }

            if ($mediaType === 'image' || $mediaType === 'audio') {
                return false;
            }

            $path = strtolower((string) $media->original_path);

            return preg_match('/\.(mp4|mov|webm|m4v)(\?.*)?$/', $path) === 1;
        };

        $isAudioMedia = fn ($media): bool => strtolower((string) ($media->media_type ?? '')) === 'audio';

        $videoUrls = $citizenMedia
            ->filter($isVideoMedia)
            ->pluck('original_path')
            ->values();

        $imageUrls = $citizenMedia
            ->reject(fn ($media) => $isVideoMedia($media) || $isAudioMedia($media))
            ->pluck('original_path')
            ->values();

        $mergedImageAndVideoUrls = $imageUrls
            ->merge($videoUrls)
            ->unique()
            ->values()
            ->toArray();

        $firstVideoUrl = $videoUrls->first();

        return [
            'images' => $mergedImageAndVideoUrls,
            'videos' => $videoUrls->toArray(),
            'video' => $firstVideoUrl,
            'video_url' => $firstVideoUrl,
            'audio' => $citizenMedia->first($isAudioMedia)?->original_path,
        ];
    }

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

        $concernMedia = $this->buildMediaPayload($concern->media);

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
            'address' => $concern->address,
            'created_at' => $concern->created_at,
            'updated_at' => $concern->updated_at,

            // Media handling
            'images' => $concernMedia['images'],
            'videos' => $concernMedia['videos'],
            'video' => $concernMedia['video'],
            'video_url' => $concernMedia['video_url'],
            'audio' => $concernMedia['audio'],

            // AI Metadata
            'summary' => $concern->summary,
            'transcript' => $concern->transcript_text,

            // Clustering Info
            'duplicatesCount' => $concern->duplicates()->count(),
            'relatedReports' => $concern->duplicates->map(function ($duplicate) {
                $duplicateMedia = $this->buildMediaPayload($duplicate->media);

                return [
                    'id' => $duplicate->id,
                    'description' => $duplicate->description,
                    'citizen_name' => $duplicate->citizen->name ?? 'Anonymous',
                    'created_at' => $duplicate->created_at,
                    'images' => $duplicateMedia['images'],
                    'videos' => $duplicateMedia['videos'],
                    'video' => $duplicateMedia['video'],
                    'video_url' => $duplicateMedia['video_url'],
                    'audio' => $duplicateMedia['audio'],
                ];
            }),

            // Citizen Relationship
            'citizen' => [
                'id' => $concern->citizen->id ?? null,
                'name' => $concern->citizen->name ?? 'Anonymous',
                'phone_number' => $concern->citizen->phone_number ?? null,
            ],
        ];
    }
}
