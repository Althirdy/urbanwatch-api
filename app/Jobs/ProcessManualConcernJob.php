<?php

namespace App\Jobs;

use App\Models\Citizen\Concern;
use App\Services\GeminiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessManualConcernJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public $backoff = [10, 30, 60];

    public $concernId;

    public function __construct($concernId)
    {
        $this->concernId = $concernId;
    }

    /**
     * Execute the job.
     */
    public function handle(GeminiService $geminiService, \App\Services\ConcernService $concernService)
    {
        $concernId = $this->concernId ?? null;

        if (! $concernId) {
            Log::error('ProcessManualConcernJob: Job started with missing concernId');

            return;
        }

        try {
            Log::info('ProcessManualConcernJob: Starting job', ['concern_id' => $concernId]);

            $concern = Concern::with('media')->find($concernId);

            if (! $concern) {
                Log::error('ProcessManualConcernJob: Concern not found', ['concern_id' => $concernId]);

                return;
            }

            // Combine title and description for analysis
            $textToAnalyze = trim($concern->title.' '.$concern->description);

            // Check for image media
            $imageContent = null;
            $mimeType = null;

            if ($concern->media->isNotEmpty()) {
                $imageMedia = $concern->media->where('media_type', 'image')->first();

                if ($imageMedia) {
                    $disk = config('filesystems.default', 'public');
                    // Fallback logic for disk if needed
                    if ($disk === 'local') {
                        $disk = 'public';
                    }

                    // Attempt to retrieve the image
                    $path = $imageMedia->public_id ?? $imageMedia->original_path;

                    if (Storage::disk($disk)->exists($path)) {
                        $imageContent = Storage::disk($disk)->get($path);
                        $mimeType = $imageMedia->mime_type;
                        Log::info('ProcessManualConcernJob: Image found and loaded for analysis', ['id' => $imageMedia->id]);
                    } elseif (Storage::disk('public')->exists($path)) {
                        // Try fallback to public directly
                        $imageContent = Storage::disk('public')->get($path);
                        $mimeType = $imageMedia->mime_type;
                        Log::info('ProcessManualConcernJob: Image found in public disk fallback', ['id' => $imageMedia->id]);
                    } else {
                        Log::warning('ProcessManualConcernJob: Image file not found in storage', ['path' => $path, 'disk' => $disk]);
                    }
                }
            }

            if (! empty($textToAnalyze) || $imageContent) {
                Log::info('ProcessManualConcernJob: Calling Gemini for Validation & Classification', [
                    'concern_id' => $concern->id,
                    'has_image' => ! empty($imageContent),
                ]);

                $analysis = $geminiService->validateAndClassify($textToAnalyze, $imageContent, $mimeType);

                Log::info('ProcessManualConcernJob: AI Result', [
                    'concern_id' => $concern->id,
                    'is_valid' => $analysis['is_valid'] ?? 'unknown',
                    'analysis' => $analysis,
                ]);

                if ($analysis && isset($analysis['is_valid'])) {
                    if ($analysis['is_valid'] === true) {
                        $concernService->markAsValid($concern->id, $analysis);
                    } else {
                        $reason = $analysis['rejection_reason'] ?? 'Ang iyong ulat ay tinukoy bilang spam o hindi wasto ng aming system.';
                        $concernService->markAsInvalid($concern->id, $reason, $analysis);
                    }
                } else {
                    Log::warning('ProcessManualConcernJob: AI failed or returned incomplete data. Routing to needs_review.', [
                        'concern_id' => $concern->id,
                        'analysis' => $analysis,
                    ]);
                    $concernService->markNeedsReview($concern->id, 'AI validation unavailable. Routed for manual review.', [
                        'analysis' => $analysis,
                        'fallback_source' => 'manual_concern_job',
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('ProcessManualConcernJob: Error', [
                'concern_id' => $concernId,
                'error' => $e->getMessage(),
            ]);
            $concernService->markNeedsReview($concernId, 'AI processing exception. Routed for manual review.', [
                'is_fallback' => true,
                'reasoning' => 'Exception during manual processing.',
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        Log::error('ProcessManualConcernJob: Job failed after all retries', [
            'concern_id' => $this->concernId,
            'error' => $exception->getMessage(),
        ]);

        if ($this->concernId) {
            $concernService = app(\App\Services\ConcernService::class);
            $concernService->markNeedsReview($this->concernId, 'AI processing failed after retries. Routed for manual review.', [
                'is_fallback' => true,
                'confidence' => 0,
                'reasoning' => 'AI processing failed after multiple attempts.',
            ]);
        }
    }
}
