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
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserSuspension;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ConcernService
{
    protected $fileUploadService;

    protected $textBeeService;

    protected $notificationService;

    public function __construct(
        FileUploadService $fileUploadService,
        TextBeeService $textBeeService,
        NotificationService $notificationService
    ) {
        $this->fileUploadService = $fileUploadService;
        $this->textBeeService = $textBeeService;
        $this->notificationService = $notificationService;
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
            ->where('is_duplicate', false) // Only show Parent Concerns
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
            ->where('is_duplicate', false)
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
            ->where('is_duplicate', false); // Count only distinct incidents

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
            ->where('is_duplicate', false);

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

            // Create History Log
            ConcernHistory::create([
                'concern_id' => $concern->id,
                'status' => 'pending',
                'remarks' => 'Concern submitted. Processing for verification...',
            ]);

            DB::commit();

            // Dispatch Voice Processing Job
            if ($concernType === 'voice') {
                ProcessVoiceConcernJob::dispatch($concern->id);
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
        $concern = Concern::find($concernId);

        if (! $concern) {
            Log::error("Concern #{$concernId} not found during finalization.");

            return;
        }

        // 1. Deduplication Logic
        $parentConcern = $this->findParentConcern($concern);

        if ($parentConcern) {
            // It's a duplicate
            $concern->update([
                'parent_concern_id' => $parentConcern->id,
                'is_duplicate' => true,
            ]);

            ConcernHistory::create([
                'concern_id' => $concern->id,
                'status' => $concern->status,
                'remarks' => "Marked as duplicate of Concern #{$parentConcern->tracking_code}. Notifications silenced.",
            ]);

            Log::info("Concern #{$concern->id} marked as duplicate of #{$parentConcern->id}");

            // Create in-app notification for citizen about the merge
            $this->notificationService->notifyConcernMerged($concern, $parentConcern);

            // Notify the citizen that their concern was merged (Pusher broadcast)
            event(new \App\Events\ConcernMerged($concern, $parentConcern));

            return; // Stop here. No further notifications.
        }

        // 2. Assignment Logic (If not a duplicate)
        // Check if already assigned to avoid double distribution
        if ($concern->distribution) {
            Log::info("Concern #{$concern->id} already distributed.");

            return;
        }

        // Distribute to Purok Leader (Hardcoded ID=2 for now per requirements)
        $purokLeaderId = 2;
        $purokLeaderDetails = \App\Models\OfficialsDetails::where('user_id', $purokLeaderId)->first();

        if (! $purokLeaderDetails) {
            Log::error("Purok Leader not found for Concern #{$concern->id}");

            // We might want to assign to admin or default instead, but for now just log
            return;
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
            'remarks' => 'Concern verified and assigned to Purok Leader.',
        ]);

        // Broadcast Event
        $uploadedMedia = $concern->media->pluck('original_path')->toArray();
        event(new ConcernAssigned($concern, $distribution, $uploadedMedia));

        // 3. Create In-App Notification for Purok Leader
        $this->notificationService->notifyConcernAssigned($concern, $distribution);

        // 4. Send SMS Notification to Purok Leader
        try {
            if ($purokLeaderDetails->contact_number) {
                $this->textBeeService->sendConcernAssignedNotification(
                    $purokLeaderDetails->contact_number,
                    [
                        'tracking_code' => $concern->tracking_code,
                        'category' => $concern->category,
                        'severity' => $concern->severity,
                        'description' => $concern->description,
                        'address' => $concern->address,
                        'custom_location' => $concern->custom_location,
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to send SMS for Concern #{$concern->id}: ".$e->getMessage());
        }
    }

    /**
     * Mark a concern as valid after AI analysis.
     */
    public function markAsValid(int $concernId, array $analysis)
    {
        $concern = Concern::find($concernId);
        if (! $concern) {
            return;
        }

        $concern->update([
            'is_valid' => true,
            'status' => 'pending',
            'category' => $analysis['category'] ?? $concern->category,
            'severity' => $analysis['severity'] ?? $concern->severity,
            'ai_category' => $analysis['category'] ?? null,
            'ai_severity' => $analysis['severity'] ?? null,
            'ai_confidence' => $analysis['confidence'] ?? null,
            'ai_processed_at' => now(),
            'ai_analysis_raw' => $analysis,
        ]);

        // Broadcast success to citizen
        event(new \App\Events\ConcernValidationSuccess($concern));

        // Proceed to finalization (Deduplication, Assignment, SMS)
        $this->finalizeConcern($concern->id);
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
        }
    }

    /**
     * Apply automated suspension based on strike count.
     */
    private function applyAutomatedSuspension(User $user)
    {
        $strikes = $user->false_alarm_strikes;
        $adminId = 1; // System Admin ID

        if ($strikes == 3) {
            UserSuspension::applySuspension($user->id, 'warning_1', $adminId, 'Automated: 3 strikes for false alarms/spam.');
        } elseif ($strikes == 4) {
            UserSuspension::applySuspension($user->id, 'warning_2', $adminId, 'Automated: 4 strikes for false alarms/spam.');
        } elseif ($strikes >= 5) {
            UserSuspension::applySuspension($user->id, 'suspension', $adminId, 'Automated: 5+ strikes for false alarms/spam. Permanent ban.');
        }
    }

    /**
     * Find a matching Parent Concern within radius and time window.
     */
    private function findParentConcern(Concern $concern)
    {
        $radius = 0.05; // 50 meters in kilometers (approx)
        // For more precision 50m = 0.05km.
        // 1 degree of latitude ~= 111km.
        // 0.05km is approx 0.00045 degrees.

        // Using Haversine formula for strict 50m check
        // Or using a simple bounding box for speed since 50m is very small.
        // Let's use Haversine for accuracy.

        $potentialParents = Concern::query()
            ->select('concerns.*')
            ->selectRaw('(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance', [$concern->latitude, $concern->longitude, $concern->latitude])
            ->where('id', '!=', $concern->id) // Not itself
            ->where('is_duplicate', false) // Only link to parents
            ->where('category', $concern->category) // Strict Category Match
            ->where('created_at', '>=', now()->subHour()) // Within last 1 hour
            ->whereNotIn('status', ['resolved', 'archived']) // Active concerns only
            ->having('distance', '<', 0.05) // 50 meters
            ->orderBy('created_at', 'asc') // Link to the oldest (original) one
            ->get();

        // Check for title/description similarity to avoid grouping unrelated concerns
        foreach ($potentialParents as $parent) {
            if ($this->areConcernsSimilar($concern, $parent)) {
                return $parent;
            }
        }

        return null;
    }

    /**
     * Check if two concerns are similar based on title and description.
     * Uses keyword matching to determine if concerns are about the same incident.
     */
    private function areConcernsSimilar(Concern $concern, Concern $parent): bool
    {
        $concernText = strtolower($concern->title . ' ' . $concern->description);
        $parentText = strtolower($parent->title . ' ' . $parent->description);

        // Extract significant words (remove common Filipino/English stop words)
        $stopWords = ['ang', 'ng', 'sa', 'na', 'may', 'at', 'ay', 'the', 'a', 'an', 'is', 'in', 'on', 'to', 'for', 'of', 'and'];
        
        $concernWords = array_diff(
            array_filter(preg_split('/\s+/', $concernText), fn($w) => strlen($w) > 2),
            $stopWords
        );
        
        $parentWords = array_diff(
            array_filter(preg_split('/\s+/', $parentText), fn($w) => strlen($w) > 2),
            $stopWords
        );

        // Find common significant words
        $commonWords = array_intersect($concernWords, $parentWords);
        
        // Require at least 1 significant common word (excluding stop words)
        // OR if the titles are very similar (same title)
        if (count($commonWords) >= 1) {
            return true;
        }

        // Check if titles are similar using Levenshtein distance
        $titleSimilarity = 1 - (levenshtein(strtolower($concern->title), strtolower($parent->title)) / max(strlen($concern->title), strlen($parent->title), 1));
        
        // If titles are more than 70% similar, consider them related
        if ($titleSimilarity >= 0.7) {
            return true;
        }

        return false;
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
}
