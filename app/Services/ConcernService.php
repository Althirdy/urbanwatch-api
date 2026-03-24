<?php

namespace App\Services;

use App\Events\ConcernAssigned;
use App\Events\ConcernFollowupDigest;
use App\Events\ConcernUnassigned;
use App\Exceptions\UrbanWatchException;
use App\Jobs\ProcessManualConcernJob;
use App\Jobs\ProcessVoiceConcernJob;
use App\Models\Citizen\Concern;
use App\Models\ConcernDistribution;
use App\Models\ConcernHistory;
use App\Models\IncidentMedia;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserSuspension;
use App\Support\VoiceAudioFileSupport;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ConcernService
{
    public function __construct(
        protected FileUploadService $fileUploadService,
        protected TextBeeService $textBeeService,
        protected NotificationService $notificationService,
        protected GeminiService $geminiService,
        protected GeographicRoutingService $routingService
    ) {}

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
            ->whereNull('parent_concern_id') // Only show Parent Concerns
            ->withCount('duplicates')
            ->select([
                'id',
                'tracking_code',
                'title',
                'severity',
                'description',
                'status',
                'category',
                'type',
                'transcript_text',
                'ai_category',
                'ai_severity',
                'ai_confidence',
                'created_at',
                'rejection_reason',
                'followups_count',
                'last_followup_at',
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

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $concerns = $query
            ->with([
                'distribution.purokLeader.officialDetails',
                'duplicates' => function ($q) {
                    $q->orderBy('created_at', 'asc'); // Chronological thread (No media loaded for list view optimization)
                },
            ])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate($perPage);

        return $concerns;
    }

    /**
     * Get paginated archived (soft-deleted) concerns for the current user.
     */
    public function getUserArchivedConcerns(int $userId, int $perPage = 15, array $filters = [])
    {
        if (! User::find($userId)) {
            throw new UrbanWatchException('User not found.');
        }

        $query = Concern::onlyTrashed()
            ->where('citizen_id', $userId)
            ->whereNull('parent_concern_id')
            ->withCount('duplicates')
            ->select([
                'id',
                'tracking_code',
                'title',
                'severity',
                'description',
                'status',
                'category',
                'type',
                'transcript_text',
                'ai_category',
                'ai_severity',
                'ai_confidence',
                'created_at',
                'deleted_at',
                'rejection_reason',
                'followups_count',
                'last_followup_at',
            ]);

        // Apply same filters
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $concerns = $query
            ->with([
                'distribution.purokLeader.officialDetails',
                'duplicates' => function ($q) {
                    $q->onlyTrashed()->orderBy('created_at', 'asc');
                },
            ])
            ->orderBy('deleted_at', 'desc')
            ->orderBy('id', 'desc')
            ->cursorPaginate($perPage);

        return $concerns;
    }

    public function getConcernsCount(int $userId, array $filters = [])
    {
        if (! User::find($userId)) {
            throw new UrbanWatchException('User not found.');
        }

        $query = Concern::where('citizen_id', $userId)
            ->whereNull('parent_concern_id'); // Count only distinct incidents

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

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $count = $query->count();

        return $count;
    }

    public function getArchivedConcernsCount(int $userId, array $filters = [])
    {
        if (! User::find($userId)) {
            throw new UrbanWatchException('User not found.');
        }

        $query = Concern::onlyTrashed()
            ->where('citizen_id', $userId)
            ->whereNull('parent_concern_id');

        // Apply the same filters
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->count();
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
                'followups_count',
                'last_followup_at',
            ])
            ->withCount('duplicates')
            ->with([
                'media' => function ($query) {
                    $query->where('source_category', 'citizen_concern');
                },
                'distribution.purokLeader.officialDetails',
                'histories.actor.officialDetails',
                'duplicates' => function ($q) {
                    $q->orderBy('created_at', 'asc')->with('media');
                },
                'parentConcern', // If user accidentally navigates to a child, show parent link
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
        $this->checkIfUserSuspended($userId, 'create concerns');

        // Check Geofencing (Boundary Restriction)
        if (isset($data['latitude']) && isset($data['longitude'])) {
            if (! $this->isInsideBoundary($data['latitude'], $data['longitude'])) {
                throw new UrbanWatchException('Your location is outside the service area (Barangay 176 E). Concern submission is restricted.');
            }
        }

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
            $trackingCode = 'CN-'.$datePart.'-'.$randomPart;

            // Create Concern
            $concern = Concern::create([
                'type' => $concernType,
                'citizen_id' => $userId,
                'title' => $title,
                'description' => $description,
                'status' => 'analyzing',
                'category' => $data['category'],
                'severity' => $data['severity'] ?? 'low',
                'transcript_text' => $data['transcript_text'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'latitude' => $data['latitude'] ?? null,
                'address' => $data['address'] ?? null,
                'custom_location' => $data['custom_location'] ?? null,
                'tracking_code' => $trackingCode,
            ]);

            $uploadedMedia = [];
            $hasVideoMedia = false;

            // Handle Media Uploads
            if ($files) {
                $this->assertFileTypesForConcernType($concernType, $files);
                $fileList = is_array($files) ? $files : [$files];
                $incomingVideoDetected = false;
                if ($concernType === 'manual') {
                    foreach ($fileList as $incomingFile) {
                        if (VoiceAudioFileSupport::isSupportedVideoUpload($incomingFile)) {
                            $incomingVideoDetected = true;
                            break;
                        }
                    }
                }

                $isMultiple = is_array($files);
                $uploadResults = $isMultiple
                    ? $this->fileUploadService->uploadMultiple($files, 'concerns')
                    : ['successful' => [$this->fileUploadService->uploadSingle($files, 'concerns')]];

                foreach ($uploadResults['successful'] as $upload) {
                    $mimeType = $upload['mime_type'] ?? '';
                    $mediaType = VoiceAudioFileSupport::isSupportedMimeOrExtension($mimeType, $upload['original_filename'] ?? null)
                        ? 'audio'
                        : (VoiceAudioFileSupport::isVideoMimeOrExtension($mimeType, $upload['original_filename'] ?? null) ? 'video' : 'image');

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
                    if ($mediaType === 'video') {
                        $hasVideoMedia = true;
                    }
                }

                // Defensive fallback for clients that send weak MIME metadata.
                if ($incomingVideoDetected && ! $hasVideoMedia) {
                    Log::warning('Manual concern video detected from upload metadata but resolved media_type lacked video', [
                        'concern_id' => $concern->id,
                    ]);
                    $hasVideoMedia = true;
                }
            }

            // Create History Log
            ConcernHistory::create([
                'concern_id' => $concern->id,
                'status' => 'pending',
                'remarks' => 'Concern submitted. Processing for verification...',
            ]);

            DB::commit();

            // Dispatch processing path by concern/media mode
            if ($concernType === 'voice') {
                ProcessVoiceConcernJob::dispatch($concern->id);
            } elseif ($hasVideoMedia) {
                $concern->update([
                    'is_valid' => true,
                    'status' => 'pending',
                    'ai_processed_at' => now(),
                    'ai_analysis_raw' => [
                        'is_fallback' => true,
                        'fallback_source' => 'manual_video_bypass',
                        'reasoning' => 'Gemini bypassed for manual video concern due to media size/processing constraints.',
                        'timestamp' => now()->toIso8601String(),
                    ],
                ]);

                ConcernHistory::create([
                    'concern_id' => $concern->id,
                    'status' => 'pending',
                    'remarks' => 'Video concern submitted. Gemini bypassed and routed directly by location.',
                ]);

                try {
                    $this->assignWithoutDeduplication($concern->id, 'Video concern assigned directly after Gemini bypass.');
                } catch (\Throwable $routingError) {
                    Log::error('Manual video concern routing failed after Gemini bypass', [
                        'concern_id' => $concern->id,
                        'error' => $routingError->getMessage(),
                    ]);
                }
            } else {
                // Dispatch Manual Concern AI Processing Job
                ProcessManualConcernJob::dispatch($concern->id);
            }

            return $concern->load(['media']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateConcern(string $id, int $userId, array $data)
    {
        $concern = Concern::where('id', $id)
            ->where('citizen_id', $userId)
            ->first();

        $this->checkIfUserSuspended($userId, 'update concerns');

        if (! $concern) {
            throw new UrbanWatchException('Concern not found.');
        }

        if ($concern->status !== 'pending') {
            throw new UrbanWatchException('Only pending concerns can be edited.');
        }

        $concern->update($data);

        return $concern;
    }

    public function deleteConcern(string $id, int $userId)
    {
        $concern = Concern::where('id', $id)
            ->where('citizen_id', $userId)
            ->first();

        $this->checkIfUserSuspended($userId, 'delete concerns');

        if (! $concern) {
            throw new UrbanWatchException('Concern not found.');
        }

        $concern->delete();
    }

    /**
     * Finalize the concern after AI processing.
     * Handles Deduplication, Assignment, and Notification.
     */
    public function finalizeConcern(int $concernId)
    {
        // Use a lock to prevent race conditions during deduplication
        // We use a broad lock per concern to ensure only one finalization happens at a time
        // for potential duplicates. A more granular lock could be used based on coordinates.
        $lock = Cache::lock("finalize_concern_processing:{$concernId}", 10);

        try {
            return $lock->block(5, function () use ($concernId) {
                $concern = Concern::find($concernId);

                if (! $concern) {
                    Log::error("Concern #{$concernId} not found during finalization.");

                    return;
                }

                // 1. Deduplication Logic
                $parentConcern = $this->findParentConcern($concern);

                if ($parentConcern) {
                    // It's a duplicate (parent_concern_id serves as the flag)
                    $concern->update([
                        'parent_concern_id' => $parentConcern->id,
                    ]);

                    $this->trackFollowupOnParent($parentConcern);

                    ConcernHistory::create([
                        'concern_id' => $concern->id,
                        'status' => $concern->status,
                        'remarks' => "Marked as duplicate of Concern #{$parentConcern->tracking_code}. Notifications silenced.",
                    ]);

                    $this->notificationService->notifyConcernMerged($concern, $parentConcern);
                    Log::info("Concern #{$concern->id} marked as duplicate of #{$parentConcern->id}");

                    // Notify the citizen that their concern was merged
                    event(new \App\Events\ConcernMerged($concern, $parentConcern));

                    $this->maybeSendFollowupDigest($parentConcern);

                    return; // Stop here. No notifications.
                }

                // 2. Assignment Logic (If not a duplicate)
                // Check if already assigned to avoid double distribution
                if ($concern->distribution) {
                    Log::info("Concern #{$concern->id} already distributed.");

                    return;
                }

                // Find Purok Leader using Geographic Routing Service
                $routeData = $this->routingService->findPurokLeader($concern->latitude, $concern->longitude);
                if ($routeData && $routeData['leader']) {
                    $purokLeaderId = $routeData['leader']->user_id;
                    $purokName = $routeData['purok']->name;
                    Log::info("Concern #{$concern->id} routed to Purok: {$purokName} (Leader ID: {$purokLeaderId})");

                    // Use the new assignToLeader method
                    $this->assignToLeader($concern, $purokLeaderId, 'Concern verified and assigned to Purok Leader.');
                } else {
                    Log::info("Concern #{$concern->id} location not found in mapping or no active leader. Remained Unassigned for Operator pool.");

                    // Create unassigned history
                    ConcernHistory::create([
                        'concern_id' => $concern->id,
                        'status' => 'pending',
                        'remarks' => 'Location not mapped to an active Purok Leader. Routing to Operator pool for manual assignment.',
                    ]);

                    // Broadcast to Operators
                    event(new ConcernUnassigned($concern));
                }
            });
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            Log::warning("Finalization lock timed out for Concern #{$concernId}. Retrying later via job if applicable.");
            throw $e;
        }
    }

    /**
     * Assign a concern to a specific leader manually or automatically.
     * Handles Distribution, History, Real-time Broadcasting, and Notifications (In-app + SMS).
     */
    public function assignToLeader(Concern $concern, int $leaderId, ?string $remarks = null): ConcernDistribution
    {
        Log::info("Assigning Concern #{$concern->id} to Leader ID: {$leaderId}");

        $distribution = ConcernDistribution::updateOrCreate(
            ['concern_id' => $concern->id],
            [
                'purok_leader_id' => $leaderId,
                'status' => 'assigned',
                'assigned_at' => now(),
            ]
        );

        $distribution->load('purokLeader.officialDetails');
        $purokLeaderDetails = $distribution->purokLeader->officialDetails;

        // Create History Log
        ConcernHistory::create([
            'concern_id' => $concern->id,
            'status' => 'pending',
            'remarks' => $remarks ?? 'Concern assigned to Purok Leader.',
        ]);

        // 1. Broadcast Real-time Event (Echo)
        $uploadedMedia = $concern->media->pluck('original_path')->toArray();
        event(new ConcernAssigned($concern, $distribution, $uploadedMedia));

        // 2. Create In-App Notification
        $this->notificationService->notifyConcernAssigned($concern, $distribution);

        // 3. Send SMS Notification (Async)
        if ($purokLeaderDetails && $purokLeaderDetails->contact_number) {
            dispatch(new \App\Jobs\SendSmsNotificationJob(
                $purokLeaderDetails->contact_number,
                [
                    'tracking_code' => $concern->tracking_code,
                    'category' => $concern->category,
                    'severity' => $concern->severity,
                    'description' => $concern->description,
                    'address' => $concern->address,
                    'custom_location' => $concern->custom_location,
                ]
            ));
        }

        // 4. Send Email Notification to Citizen (Async)
        $concern->load('citizen');
        if ($concern->citizen && $concern->citizen->email) {
            \Illuminate\Support\Facades\Mail::to($concern->citizen->email)
                ->queue(new \App\Mail\ConcernAssignedMail($concern, $purokLeaderDetails));
        }

        return $distribution;
    }

    /**
     * Assign a concern without deduplication.
     * Used for voice AI fallback so the concern still proceeds through normal operations.
     */
    public function assignWithoutDeduplication(int $concernId, ?string $remarks = null): void
    {
        $lock = Cache::lock("assign_without_deduplication:{$concernId}", 10);

        try {
            $lock->block(5, function () use ($concernId, $remarks) {
                $concern = Concern::find($concernId);

                if (! $concern) {
                    Log::error("Concern #{$concernId} not found for assignWithoutDeduplication.");

                    return;
                }

                if ($concern->distribution) {
                    Log::info("Concern #{$concern->id} already distributed in assignWithoutDeduplication.");

                    return;
                }

                $routeData = $this->routingService->findPurokLeader($concern->latitude, $concern->longitude);
                if ($routeData && $routeData['leader']) {
                    $purokLeaderId = $routeData['leader']->user_id;
                    $this->assignToLeader(
                        $concern,
                        $purokLeaderId,
                        $remarks ?? 'Concern assigned after voice AI fallback.'
                    );

                    return;
                }

                ConcernHistory::create([
                    'concern_id' => $concern->id,
                    'status' => 'pending',
                    'remarks' => $remarks ?? 'Voice concern fallback: no mapped active Purok Leader. Routed to Operator pool.',
                ]);

                event(new ConcernUnassigned($concern));
            });
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            Log::warning("assignWithoutDeduplication lock timed out for Concern #{$concernId}.");
            throw $e;
        }
    }

    /**
     * Mark a concern as valid after AI analysis.
     *
     * Implements Weighted Coherence/Detail scoring with rejection thresholds:
     * - Coherence < 0.60: Reject (Title/Description/Image mismatch)
     * - Detail < 0.50: Reject (Insufficient context: Who, What, Where)
     */
    public function markAsValid(int $concernId, array $analysis)
    {
        $concern = Concern::find($concernId);
        if (! $concern || $concern->is_valid) {
            return;
        }

        $confidence = $analysis['confidence'] ?? 0;
        $coherenceScore = $analysis['coherence_score'] ?? 0.8; // Default to passing if not provided
        $detailScore = $analysis['detail_score'] ?? 0.8; // Default to passing if not provided
        $isFallback = $analysis['is_fallback'] ?? false;

        // Weighted Score Calculation: Coherence (40%) + Detail (40%) + Confidence (20%)
        $weightedScore = ($coherenceScore * 0.4) + ($detailScore * 0.4) + ($confidence * 0.2);

        Log::info('Concern validation decision started', [
            'concern_id' => $concernId,
            'type' => $concern->type,
            'is_fallback' => $isFallback,
            'ai_is_valid' => $analysis['is_valid'] ?? null,
            'confidence' => $confidence,
            'coherence_score' => $coherenceScore,
            'detail_score' => $detailScore,
            'weighted_score' => $weightedScore,
        ]);

        // Rejection logic remains strict for non-voice concerns only.
        // Voice concerns are validated primarily via Gemini's is_valid signal to avoid false negatives from score noise.
        if (! $isFallback && $concern->type !== 'voice') {
            if ($coherenceScore < 0.60) {
                Log::info("Concern #{$concernId} rejected: Low coherence score ({$coherenceScore})");

                return $this->markAsInvalid(
                    $concernId,
                    'Hindi tugma ang detalye ng ulat. Paki-check kung tama ang title, description, at image.',
                    $analysis
                );
            }

            if ($detailScore < 0.50) {
                Log::info("Concern #{$concernId} rejected: Low detail score ({$detailScore})");

                return $this->markAsInvalid(
                    $concernId,
                    'Kulang ang detalye ng ulat. Paki-lagay ng mas specific na location at description.',
                    $analysis
                );
            }

            if ($weightedScore < 0.70) {
                Log::info("Concern #{$concernId} rejected: Low weighted score ({$weightedScore})");

                return $this->markAsInvalid(
                    $concernId,
                    'Ang iyong ulat ay hindi sapat ang detalye o hindi wasto para sa aming system.',
                    $analysis
                );
            }
        } elseif (! $isFallback && $concern->type === 'voice') {
            Log::info("Concern #{$concernId} voice concern: score-gate rejection skipped", [
                'coherence_score' => $coherenceScore,
                'detail_score' => $detailScore,
                'weighted_score' => $weightedScore,
            ]);
        }

        // Hierarchy: AI Result (if high confidence) > Existing Value
        $isHighConfidence = $confidence >= 0.7;

        $finalCategory = ($isHighConfidence && ! empty($analysis['category']))
            ? $analysis['category']
            : $concern->category;

        $finalSeverity = ($isHighConfidence && ! empty($analysis['severity']))
            ? $analysis['severity']
            : $concern->severity;

        $concern->update([
            'is_valid' => true,
            'status' => 'pending',
            'category' => $finalCategory,
            'severity' => $finalSeverity,
            'specific_type' => $analysis['specific_type'] ?? $concern->specific_type,
            'ai_category' => $analysis['category'] ?? null,
            'ai_severity' => $analysis['severity'] ?? null,
            'ai_confidence' => $confidence,
            'coherence_score' => $coherenceScore,
            'detail_score' => $detailScore,
            'ai_processed_at' => now(),
            'ai_analysis_raw' => $analysis,
        ]);

        // Broadcast success to citizen
        event(new \App\Events\ConcernValidationSuccess($concern));

        // Proceed to finalization (Deduplication, Assignment, SMS)
        $this->finalizeConcern($concern->id);
    }

    /**
     * Centralized logic for an official (Purok Leader or Operator) to reject a concern.
     * Marks as invalid/rejected and increments citizen strikes.
     */
    public function rejectConcernByOfficial(Concern $concern, string $reason, User $actor)
    {
        return DB::transaction(function () use ($concern, $reason, $actor) {
            $this->markAsInvalid($concern->id, $reason, [
                'rejected_by' => $actor->id,
                'rejection_timestamp' => now()->toDateTimeString(),
            ]);

            // Update distribution status if it exists
            if ($concern->distribution) {
                $concern->distribution->update(['status' => 'rejected']);
            }

            // The markAsInvalid already handles history and strikes.
            return $concern->fresh();
        });
    }

    /**
     * Mark a concern as invalid/spam after AI analysis.
     */
    public function markAsInvalid(int $concernId, string $reason, ?array $rawAnalysis = null)
    {
        $concern = Concern::find($concernId);
        if (! $concern) {
            return;
        }

        // Defensive guard for voice concerns:
        // if Gemini explicitly marked it valid, never apply invalid path.
        if (
            $concern->type === 'voice'
            && is_array($rawAnalysis)
            && array_key_exists('is_valid', $rawAnalysis)
            && $rawAnalysis['is_valid'] === true
        ) {
            Log::warning('Voice concern invalidation blocked; Gemini returned is_valid=true', [
                'concern_id' => $concernId,
                'incoming_reason' => $reason,
                'coherence_score' => $rawAnalysis['coherence_score'] ?? null,
                'detail_score' => $rawAnalysis['detail_score'] ?? null,
            ]);

            $this->markAsValid($concernId, $rawAnalysis);

            return;
        }

        if ($concern->status === 'rejected') {
            Log::info('Concern rejection duplicate suppressed', [
                'concern_id' => $concernId,
                'existing_reason' => $concern->rejection_reason,
                'incoming_reason' => $reason,
            ]);

            return;
        }

        $concern->update([
            'is_valid' => false,
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'ai_analysis_raw' => $rawAnalysis,
        ]);

        ConcernHistory::create([
            'concern_id' => $concern->id,
            'status' => 'rejected',
            'remarks' => "Rejected by AI: {$reason}",
        ]);

        // Increment user strikes
        $user = User::find($concern->citizen_id);
        if ($user) {
            $user->increment('false_alarm_strikes');
            $strikes = $user->false_alarm_strikes;

            // Apply automated suspension rules
            $this->applyAutomatedSuspension($user);

            // Broadcast failure to citizen
            event(new \App\Events\ConcernValidationFailed($concern, $reason, $strikes));

            // Send Email Notification to Citizen (Async)
            if ($user->email) {
                \Illuminate\Support\Facades\Mail::to($user->email)
                    ->queue(new \App\Mail\ConcernValidationResultMail($concern, false, $reason));
            }
        }
    }

    /**
     * Mark concern as needs_review when AI processing is unavailable or inconsistent.
     */
    public function markNeedsReview(int $concernId, string $reason, ?array $rawAnalysis = null): void
    {
        $concern = Concern::find($concernId);
        if (! $concern) {
            return;
        }

        $concern->update([
            'status' => 'needs_review',
            'rejection_reason' => $reason,
            'ai_analysis_raw' => $rawAnalysis,
            'ai_processed_at' => now(),
        ]);

        ConcernHistory::create([
            'concern_id' => $concern->id,
            'status' => 'needs_review',
            'remarks' => "Needs manual review: {$reason}",
        ]);
    }

    /**
     * Apply automated suspension based on strike count.
     */
    private function applyAutomatedSuspension(User $user)
    {
        $strikes = $user->false_alarm_strikes;
        $adminId = 1; // System Admin ID
        $activeSuspension = UserSuspension::getActiveSuspension($user->id);

        if ($strikes == 3) {
            if ($activeSuspension?->punishment_type !== 'warning_1') {
                UserSuspension::applySuspension($user->id, 'warning_1', $adminId, 'Automated: 3 strikes for false alarms/spam.');
            }
        } elseif ($strikes == 5) {
            if ($activeSuspension?->punishment_type !== 'warning_2') {
                UserSuspension::applySuspension($user->id, 'warning_2', $adminId, 'Automated: 5 strikes for false alarms/spam.');
            }
        } elseif ($strikes >= 8) {
            if ($activeSuspension?->punishment_type !== 'suspension') {
                UserSuspension::applySuspension($user->id, 'suspension', $adminId, 'Automated: 8+ strikes for false alarms/spam. Permanent ban.');
            }
        }
    }

    /**
     * Find a matching Parent Concern within radius and time window.
     * Implements "Smart Radius" and "High Confidence" checks.
     */
    private function findParentConcern(Concern $concern)
    {
        // 1. High Confidence Check: Only merge if the AI is reasonably sure,
        // unless it's a fallback/manual entry where ai_confidence might be 0.
        // We use 0.7 (70%) as the threshold for 'automatic' merging.
        if ($concern->ai_confidence > 0 && $concern->ai_confidence < 0.7) {
            return null;
        }

        // 2. Smart Radius based on category/type
        // Pothole/Garbage/Light: 30m (0.03km) - Very localized
        // Fire/Flood/Accident: 150m (0.15km) - High visibility/impact
        // Default: 50m (0.05km)
        $radius = 0.05;
        $type = $concern->specific_type ?: $concern->category;

        if (in_array($type, ['pothole', 'garbage', 'light', 'sewage'])) {
            $radius = 0.03;
        } elseif (in_array($type, ['fire', 'flood', 'accident', 'collision'])) {
            $radius = 0.15;
        }

        $parentConcern = Concern::query()
            ->select('concerns.*')
            ->selectRaw('(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance', [$concern->latitude, $concern->longitude, $concern->latitude])
            ->where('id', '!=', $concern->id) // Not itself
            ->whereNull('parent_concern_id') // Only link to parents
            ->where(function ($query) use ($concern) {
                // Use specific type if available for better precision
                if ($concern->specific_type) {
                    $query->where('specific_type', $concern->specific_type);
                } else {
                    $query->where('category', $concern->category);
                }
            })
            ->where('created_at', '>=', now()->subHours(6)) // Within last 6 hours
            // 3. Exclude Rejected, Resolved, and Archived concerns from being parents
            ->whereNotIn('status', ['rejected', 'resolved', 'archived'])
            ->having('distance', '<', $radius)
            ->orderBy('created_at', 'asc') // Link to the oldest (original) one
            ->first();

        // 4. Gemini Cross-Check (Semantic Match)
        // If we found a spatial candidate, verify the content matches semantically.
        if ($parentConcern) {
            $text1 = $concern->type === 'voice' ? $concern->transcript_text : ($concern->title.' '.$concern->description);
            $text2 = $parentConcern->type === 'voice' ? $parentConcern->transcript_text : ($parentConcern->title.' '.$parentConcern->description);

            // If both reports are very brief/empty, default to merging spatially
            if (strlen($text1 ?? '') < 5 || strlen($text2 ?? '') < 5) {
                return $parentConcern;
            }

            $isSame = $this->geminiService->compareConcerns($text1, $text2);

            if (! $isSame) {
                Log::info("Gemini rejected deduplication for Concern #{$concern->id} and #{$parentConcern->id} due to semantic differences.");

                return null; // Don't merge if Gemini says they are different incidents
            }
        }

        return $parentConcern;
    }

    private function checkIfUserSuspended(int $userId, string $action = 'perform this action'): void
    {
        if (\App\Models\UserSuspension::isUserSuspended($userId)) {
            $activeSuspension = \App\Models\UserSuspension::getActiveSuspension($userId);

            $message = "Your account is currently suspended and cannot {$action}.";
            if ($activeSuspension) {
                if ($activeSuspension->punishment_type === 'suspension') {
                    $message = "Your account has been permanently suspended and cannot {$action}.";
                } else {
                    $expiresAt = $activeSuspension->expires_at->format('F j, Y \\a\\t g:i A');
                    $message = "Your account is suspended until {$expiresAt} and cannot {$action}.";
                }

                if ($activeSuspension->reason) {
                    $message .= " Reason: {$activeSuspension->reason}";
                }
            }

            throw new UrbanWatchException($message);
        }
    }

    private function trackFollowupOnParent(Concern $parentConcern): void
    {
        $parentConcern->increment('followups_count');
        $parentConcern->forceFill([
            'last_followup_at' => now(),
        ])->save();
    }

    private function maybeSendFollowupDigest(Concern $parentConcern): void
    {
        $parentConcern->loadMissing('distribution');
        $distribution = $parentConcern->distribution;
        if (! $distribution) {
            return;
        }

        $total = (int) $parentConcern->followups_count;
        $lastDigestCount = (int) ($parentConcern->last_digest_count ?? 0);
        $newFollowups = $total - $lastDigestCount;
        if ($newFollowups <= 0) {
            return;
        }

        $thresholds = [5, 20, 50, 100];
        $crossedThreshold = false;
        foreach ($thresholds as $threshold) {
            if ($lastDigestCount < $threshold && $total >= $threshold) {
                $crossedThreshold = true;
                break;
            }
        }

        $lastDigestAt = $parentConcern->last_digest_notified_at;
        $timeBasedEligible = $lastDigestAt === null || $lastDigestAt->lte(now()->subMinutes(10));
        if (! $crossedThreshold && ! $timeBasedEligible) {
            return;
        }

        $this->notificationService->notifyConcernFollowupDigest($parentConcern, $distribution, $newFollowups);
        event(new ConcernFollowupDigest($parentConcern, $distribution, $newFollowups, $total));

        $parentConcern->forceFill([
            'last_digest_count' => $total,
            'last_digest_notified_at' => now(),
        ])->save();
    }

    private function assertFileTypesForConcernType(string $concernType, $files): void
    {
        $fileList = is_array($files) ? $files : [$files];

        if ($concernType === 'voice') {
            if (count($fileList) !== 1) {
                throw new UrbanWatchException('Voice concern requires exactly one audio file.', 422);
            }

            foreach ($fileList as $file) {
                if (! VoiceAudioFileSupport::isSupportedUpload($file)) {
                    throw new UrbanWatchException('Voice concern file must be a supported audio format (m4a, mp3, wav, aac, 3gp, mp4, ogg, webm, opus).', 422);
                }
            }

            return;
        }

        $hasImage = false;
        $hasVideo = false;

        foreach ($fileList as $file) {
            $mimeType = (string) ($file->getMimeType() ?? '');
            $isImage = VoiceAudioFileSupport::isImageMime($mimeType);
            $isVideo = VoiceAudioFileSupport::isSupportedVideoUpload($file);

            if (! $isImage && ! $isVideo) {
                throw new UrbanWatchException('Manual concern accepts image or video files only.', 422);
            }

            if ($isImage) {
                $hasImage = true;
            }

            if ($isVideo) {
                $hasVideo = true;
            }
        }

        if ($hasImage && $hasVideo) {
            throw new UrbanWatchException('Manual concern cannot mix image and video attachments.', 422);
        }

        if ($hasVideo && count($fileList) !== 1) {
            throw new UrbanWatchException('Manual concern accepts exactly one video file.', 422);
        }
    }

    /**
     * Check if a coordinate is inside the defined geofence boundary.
     * Uses Ray Casting algorithm (Point-in-Polygon).
     */
    private function isInsideBoundary($latitude, $longitude)
    {
        // 1. Check if Geofencing is Enabled (Cached for 5 mins)
        $isEnabled = Cache::remember('geofencing_enabled', 300, function () {
            return SystemSetting::get('geofencing_enabled') === 'true';
        });

        if (! $isEnabled) {
            return true; // Bypass check if feature is OFF
        }

        // 2. Point-in-Polygon Algorithm
        $vertices = config('geofencing.boundary');

        if (empty($vertices)) {
            Log::warning('Geofencing boundary is empty in config/geofencing.php');

            return true; // Fail safe: Allow if config is missing
        }

        $x = $longitude;
        $y = $latitude;

        $inside = false;
        for ($i = 0, $j = count($vertices) - 1; $i < count($vertices); $j = $i++) {
            $xi = $vertices[$i][0]; // Longitude
            $yi = $vertices[$i][1]; // Latitude
            $xj = $vertices[$j][0];
            $yj = $vertices[$j][1];

            $intersect = (($yi > $y) != ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    /**
     * Handle citizen's response to a resolution confirmation request.
     * If confirmed → flag with resolution_confirmed_at (status stays awaiting_confirmation).
     *   The PurokLeader must still manually resolve after seeing the confirmation.
     * If disputed → set status back to 'ongoing' with the citizen's reason.
     */
    public function confirmResolution(int $concernId, int $citizenId, bool $confirmed, ?string $reason = null): Concern
    {
        return DB::transaction(function () use ($concernId, $citizenId, $confirmed, $reason) {
            $concern = Concern::where('id', $concernId)
                ->where('citizen_id', $citizenId)
                ->first();

            if (! $concern) {
                throw new UrbanWatchException('Concern not found.');
            }

            if ($concern->status !== 'awaiting_confirmation') {
                throw new UrbanWatchException('This concern is not awaiting confirmation.', 422);
            }

            $distribution = $concern->distribution;
            if (! $distribution) {
                throw new UrbanWatchException('Concern distribution not found.');
            }

            $previousStatus = $concern->status;

            if ($confirmed) {
                // Citizen confirms — automatically mark as resolved
                $confirmRemarks = 'Citizen confirmed resolution.';
                if ($reason) {
                    $confirmRemarks .= " Remarks: {$reason}";
                }

                $concern->update([
                    'status' => 'resolved',
                    'resolution_confirmed_at' => now(),
                ]);

                // Update distribution status
                $distribution->update(['status' => 'resolved']);

                ConcernHistory::create([
                    'concern_id' => $concern->id,
                    'acted_by' => $citizenId,
                    'status' => 'resolved',
                    'remarks' => $confirmRemarks,
                ]);

                // Notify the purok leader that citizen confirmed
                $purokLeader = $distribution->purokLeader;
                if ($purokLeader) {
                    $this->notificationService->notifyResolutionConfirmationResult(
                        $concern,
                        $purokLeader,
                        true,
                        $reason
                    );

                    // Broadcast update
                    event(new \App\Events\ConcernStatusUpdated(
                        $concern->fresh(),
                        $distribution->fresh(),
                        $previousStatus,
                        'resolved',
                        $purokLeader,
                        $confirmRemarks
                    ));
                }

                // Also update duplicates
                foreach ($concern->duplicates as $duplicate) {
                    $duplicate->update(['status' => 'resolved']);
                    ConcernHistory::create([
                        'concern_id' => $duplicate->id,
                        'acted_by' => $citizenId,
                        'status' => 'resolved',
                        'remarks' => "Status mirrored from Parent Concern #{$concern->tracking_code}: {$confirmRemarks}",
                    ]);
                }
            } else {
                // Citizen disputes resolution — revert to ongoing
                $concern->update([
                    'status' => 'ongoing',
                    'resolution_requested_at' => null,
                    'resolution_confirmed_at' => null,
                ]);

                $distribution->update(['status' => 'in_progress']);

                $disputeRemarks = 'Citizen disputed resolution.';
                if ($reason) {
                    $disputeRemarks .= " Reason: {$reason}";
                }

                ConcernHistory::create([
                    'concern_id' => $concern->id,
                    'acted_by' => $citizenId,
                    'status' => 'ongoing',
                    'remarks' => $disputeRemarks,
                ]);

                // Notify the purok leader
                $purokLeader = $distribution->purokLeader;
                if ($purokLeader) {
                    $this->notificationService->notifyResolutionConfirmationResult(
                        $concern,
                        $purokLeader,
                        false,
                        $reason
                    );

                    // Broadcast status change
                    event(new \App\Events\ConcernStatusUpdated(
                        $concern->fresh(),
                        $distribution->fresh(),
                        $previousStatus,
                        'ongoing',
                        $purokLeader,
                        $disputeRemarks
                    ));
                }

                // Also revert duplicates
                foreach ($concern->duplicates as $duplicate) {
                    $duplicate->update(['status' => 'ongoing']);
                    ConcernHistory::create([
                        'concern_id' => $duplicate->id,
                        'acted_by' => $citizenId,
                        'status' => 'ongoing',
                        'remarks' => "Status mirrored from Parent Concern #{$concern->tracking_code}: {$disputeRemarks}",
                    ]);
                }
            }

            return $concern->fresh();
        });
    }
}
