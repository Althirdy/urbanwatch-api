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

class ProcessVoiceConcernJob implements ShouldQueue
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
            Log::error('ProcessVoiceConcernJob: Job started with missing concernId');

            return;
        }

        try {
            $concern = Concern::with(['media' => function ($query) {
                $query->where('media_type', 'audio')->orderBy('created_at', 'desc');
            }])->find($concernId);

            if (! $concern) {
                Log::error('ProcessVoiceConcernJob: Concern not found', ['concern_id' => $concernId]);

                return;
            }

            // Find the audio file
            $audioMedia = $concern->media->first();

            if (! $audioMedia) {
                Log::warning('ProcessVoiceConcernJob: No audio media found for concern', ['concern_id' => $concern->id]);

                $concernService->markNeedsReview($concern->id, 'No audio file found for voice concern. Manual review required.', [
                    'fallback_source' => 'voice_concern_missing_audio',
                ]);

                return;
            }

            // Retrieve the file content
            // Assuming public_id stores the relative storage path as per FileUploadService
            $storagePath = $audioMedia->public_id;

            // Use the same disk logic as FileUploadService for consistency
            $disk = config('filesystems.default');

            // Apply same fallback logic as FileUploadService
            if ($disk === 's3' && empty(config('filesystems.disks.s3.bucket'))) {
                $disk = 'public';
            }
            if ($disk === 'local') {
                $disk = 'public';
            }

            if (! Storage::disk($disk)->exists($storagePath)) {
                Log::error('ProcessVoiceConcernJob: Audio file not found in storage', [
                    'concern_id' => $concern->id,
                    'path' => $storagePath,
                    'disk' => $disk,
                    'configured_disk' => config('filesystems.default'),
                ]);

                $concernService->markNeedsReview($concern->id, 'Audio file unavailable in storage. Manual review required.', [
                    'storage_path' => $storagePath,
                    'disk' => $disk,
                ]);

                return;
            }

            $fileContent = Storage::disk($disk)->get($storagePath);
            $mimeType = $audioMedia->mime_type ?? 'audio/mp3'; // Default fallback

            // Call Gemini Service - now includes category, severity, and validity analysis
            $analysis = $geminiService->analyzeAudio($fileContent, $mimeType);

            if ($analysis) {
                // Prepare update data with transcription
                $updateData = [
                    'title' => $analysis['title'] ?? $concern->title,
                    'description' => $analysis['description'] ?? $concern->description,
                    'transcript_text' => $analysis['transcription_text'] ?? null,
                ];

                $concern->update($updateData);

                if (isset($analysis['is_valid']) && $analysis['is_valid'] === true) {
                    $concernService->markAsValid($concern->id, $analysis);
                } else {
                    $reason = $analysis['rejection_reason'] ?? 'Ang iyong voice report ay tinukoy bilang spam o hindi wasto.';
                    $concernService->markAsInvalid($concern->id, $reason, $analysis);
                }
            } else {
                Log::warning('ProcessVoiceConcernJob: Gemini analysis failed or returned null', [
                    'concern_id' => $concern->id,
                ]);

                // Fallback: Update with default text so UI doesn't show "Processing..." forever
                $concern->update([
                    'transcript_text' => 'Transcription unavailable. Please listen to the attached audio.',
                ]);

                $concernService->markNeedsReview($concern->id, 'Voice AI analysis unavailable. Routed for manual review.', [
                    'is_fallback' => true,
                    'reasoning' => 'Gemini analysis failed or returned null.',
                ]);
            }

        } catch (\Exception $e) {
            Log::error('ProcessVoiceConcernJob: Error processing voice concern', [
                'concern_id' => $concernId,
                'error' => $e->getMessage(),
            ]);

            // Fallback: Update with error text
            $concern = Concern::find($concernId);
            if ($concern) {
                $concern->update([
                    'transcript_text' => 'Transcription unavailable due to system error.',
                ]);
            }

            $concernService->markNeedsReview($concernId, 'Voice AI processing exception. Routed for manual review.', [
                'is_fallback' => true,
                'reasoning' => 'Exception during voice processing.',
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        $concernId = $this->concernId ?? null;

        Log::error('ProcessVoiceConcernJob: Job failed after all retries', [
            'concern_id' => $concernId,
            'error' => $exception->getMessage(),
        ]);

        if ($concernId) {
            $concernService = app(\App\Services\ConcernService::class);
            $concernService->markNeedsReview($concernId, 'Voice AI failed after retries. Routed for manual review.', [
                'is_fallback' => true,
                'confidence' => 0,
                'reasoning' => 'Voice analysis failed after multiple attempts.',
            ]);
        }
    }
}
