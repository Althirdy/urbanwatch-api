<?php

namespace App\Services;

use App\Events\ConcernAssigned;
use App\Exceptions\UrbanWatchException;
use App\Jobs\ProcessManualConcernJob;
use App\Jobs\ProcessVoiceConcernJob;
use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\ConcernHistory;
use App\Models\IncidentMedia;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ConcernService
{
    protected $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Get paginated concerns for the current user.
     * Returns a cursor paginator with simplified data.
     * Supports filtering by status, category, and severity.
     */
    public function getUserConcerns(int $userId, int $perPage = 15, array $filters = [])
    {
        if (! User::find($userId)) {
            throw new UrbanWatchException('User not found.');
        }

        $query = Concern::where('citizen_id', $userId)
            ->select([
                'id',
                'tracking_code',
                'title',
                'severity',
                'description',
                'status',
                'category',
                'created_at',
            ]);

        // Apply filters
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        $concerns = $query
            ->with([
                'distribution.purokLeader.officialDetails',
            ])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate($perPage);

        return $concerns;
    }

    public function getConcernsCount(int $userId, array $filters = [])
    {
        if (! User::find($userId)) {
            throw new UrbanWatchException('User not found.');
        }

        $query = Concern::where('citizen_id', $userId);

        // Apply the same filters as getUserConcerns
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        $count = $query->count();

        return $count;
    }

    /**
     * Get a single concern with full details.
     */
    public function getConcernDetails(string $id, int $userId)
    {
        if (! User::find($userId)) {
            throw new UrbanWatchException('User not found.');
        }

        $concern = Concern::where('id', $id)
            ->where('citizen_id', $userId)
            ->select([
                'id',
                'tracking_code',
                'title',
                'type',
                'description',
                'category',
                'status',
                'transcript_text',
                'longitude',
                'latitude',
                'address',
                'custom_location',
                'severity',
                'created_at',
                'rejection_reason',
                'is_valid',
            ])
            ->with([
                'media' => function ($query) {
                    $query->where('source_category', 'citizen_concern');
                },
                'distribution.purokLeader.officialDetails',
                'histories.actor.officialDetails',
            ])
            ->first();

        if (! $concern) {
            throw new UrbanWatchException('Concern not found.');
        }

        return $concern;
    }

    /**
     * Store a new concern.
     */
    public function createConcern(array $data, int $userId, $files = null)
    {
        DB::beginTransaction();

        try {
            $concernType = $data['type'];

            // Prepare Title & Description
            if ($concernType === 'voice') {
                $title = $data['title'] ?? 'Voice Concern - '.now()->format('M d, Y H:i');
                $description = $data['description'] ?? 'Audio recording received. Transcription pending...';
            } else {
                $title = $data['title'];
                $description = $data['description'];
            }

            // Generate Tracking Code
            $datePart = now()->format('Ymd');
            $randomPart = Str::upper(Str::random(4));
            $trackingCode = "CN-{$datePart}-{$randomPart}";

            // Create Concern
            $concern = Concern::create([
                'type' => $concernType,
                'citizen_id' => $userId,
                'title' => $title,
                'description' => $description,
                'status' => 'pending',
                'category' => $data['category'],
                'severity' => $data['severity'] ?? 'low',
                'user_selected_category' => $data['category'], // Store user's selection
                'user_selected_severity' => $data['severity'] ?? 'low', // Store user's selection
                'transcript_text' => $data['transcript_text'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'latitude' => $data['latitude'] ?? null,
                'address' => $data['address'] ?? null,
                'custom_location' => $data['custom_location'] ?? null,
                'tracking_code' => $trackingCode,
            ]);

            $uploadedMedia = [];

            // Handle Media Uploads
            if ($files) {
                $isMultiple = is_array($files);
                $uploadResults = $isMultiple
                    ? $this->fileUploadService->uploadMultiple($files, 'concerns')
                    : ['successful' => [$this->fileUploadService->uploadSingle($files, 'concerns')]];

                foreach ($uploadResults['successful'] as $upload) {
                    $mimeType = $upload['mime_type'] ?? '';
                    $mediaType = str_starts_with($mimeType, 'audio/') ? 'audio' : 'image';

                    $media = IncidentMedia::create([
                        'source_type' => Concern::class,
                        'source_id' => $concern->id,
                        'source_category' => 'citizen_concern',
                        'media_type' => $mediaType,
                        'original_path' => $upload['public_url'] ?? null,
                        'public_id' => $upload['storage_path'] ?? null,
                        'original_filename' => $upload['original_filename'] ?? null,
                        'file_size' => $upload['file_size'] ?? null,
                        'mime_type' => $mimeType,
                        'captured_at' => now(),
                    ]);

                    $uploadedMedia[] = $media->original_path;
                }
            }

            // Distribute to Purok Leader (Hardcoded ID=2 for now per requirements)
            $purokLeaderId = 2;

            $purokLeaderDetails = \App\Models\OfficialsDails::where('id', $purokLeaderId)->first();

            if (! $purokLeaderDetails) {
                throw new UrbanWatchException('Purok Leader not found for distribution.');
            }

            $distribution = ConcernDistribution::create([
                'concern_id' => $concern->id,
                'purok_leader_id' => $purokLeaderId,
                'status' => 'assigned',
                'assigned_at' => now(),
            ]);

            $distribution->load('purokLeader.officialDetails');

            // Create History Log
            ConcernHistory::create([
                'concern_id' => $concern->id,
                'status' => 'pending',
                'remarks' => 'Concern submitted and automatically distributed to Purok Leader.',
            ]);

            // Broadcast Event
            event(new ConcernAssigned($concern, $distribution, $uploadedMedia));

            DB::commit();

            // Dispatch Voice Processing Job
            if ($concernType === 'voice') {
                ProcessVoiceConcernJob::dispatch($concern->id);
            } else {
                // Dispatch Manual Concern AI Processing Job
                ProcessManualConcernJob::dispatch($concern->id);
            }

            return $concern->load(['media', 'distribution.purokLeader.officialDetails']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    // public function updateConcern(string $id, int $userId, array $data)
    // {
    //     $concern = Concern::where('id', $id)
    //         ->where('citizen_id', $userId)
    //         ->first();

    //     if (!$concern) {
    //         throw new UrbanWatchException("Concern not found.");
    //     }

    //     $concern->update($data);
    //     return $concern;
    // }

    public function deleteConcern(string $id, int $userId)
    {
        $concern = Concern::where('id', $id)
            ->where('citizen_id', $userId)
            ->first();

        if (! $concern) {
            throw new UrbanWatchException('Concern not found.');
        }

        $concern->softDelete();
    }
}
