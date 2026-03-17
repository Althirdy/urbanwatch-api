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
use Throwable;

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
        $audioStream = null;

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

            $mimeType = $audioMedia->mime_type ?? 'audio/mp3'; // Default fallback
            $audioSize = (int) ($audioMedia->file_size ?? 0);

            if ($audioSize <= 0) {
                try {
                    $audioSize = (int) Storage::disk($disk)->size($storagePath);
                } catch (Throwable $e) {
                    Log::warning('ProcessVoiceConcernJob: Failed to resolve audio size from storage', [
                        'concern_id' => $concern->id,
                        'path' => $storagePath,
                        'disk' => $disk,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            if ($audioSize <= 0) {
                Log::error('ProcessVoiceConcernJob: Invalid audio size for voice concern', [
                    'concern_id' => $concern->id,
                    'path' => $storagePath,
                    'disk' => $disk,
                    'file_size_meta' => $audioMedia->file_size,
                ]);

                $concernService->markNeedsReview($concern->id, 'Audio file size is invalid. Manual review required.', [
                    'storage_path' => $storagePath,
                    'disk' => $disk,
                    'fallback_source' => 'voice_concern_invalid_audio_size',
                ]);

                return;
            }

            $audioStream = Storage::disk($disk)->readStream($storagePath);
            if (! is_resource($audioStream)) {
                Log::error('ProcessVoiceConcernJob: Unable to open audio stream from storage', [
                    'concern_id' => $concern->id,
                    'path' => $storagePath,
                    'disk' => $disk,
                ]);

                $concernService->markNeedsReview($concern->id, 'Audio stream unavailable in storage. Manual review required.', [
                    'storage_path' => $storagePath,
                    'disk' => $disk,
                    'fallback_source' => 'voice_concern_stream_open_failed',
                ]);

                return;
            }

            // Call Gemini Service - now includes category, severity, and validity analysis
            $analysis = $geminiService->analyzeAudio($audioStream, $audioSize, $mimeType, [
                'concern_id' => $concern->id,
            ]);

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
                    Log::warning('ProcessVoiceConcernJob: Voice concern marked invalid by AI', [
                        'concern_id' => $concern->id,
                        'reason' => $reason,
                        'confidence' => $analysis['confidence'] ?? null,
                        'category' => $analysis['category'] ?? null,
                        'severity' => $analysis['severity'] ?? null,
                        'transcript_preview' => isset($analysis['transcription_text'])
                            ? mb_substr((string) $analysis['transcription_text'], 0, 180)
                            : null,
                    ]);
                    $concernService->markAsInvalid($concern->id, $reason, $analysis);
                }
            } else {
                Log::warning('ProcessVoiceConcernJob: Gemini analysis failed or returned null', [
                    'concern_id' => $concern->id,
                ]);

                $this->applyAiFailureFallback(
                    $concernService,
                    $concern,
                    'Gemini analysis failed or returned null.',
                    [
                        'fallback_source' => 'voice_ai_analysis_null',
                    ]
                );
            }

        } catch (Throwable $e) {
            Log::error('ProcessVoiceConcernJob: Error processing voice concern', [
                'concern_id' => $concernId,
                'error' => $e->getMessage(),
            ]);

            $concern = Concern::find($concernId);
            if ($concern) {
                $this->applyAiFailureFallback(
                    $concernService,
                    $concern,
                    'Exception during voice processing.',
                    [
                        'fallback_source' => 'voice_processing_exception',
                        'exception' => get_class($e),
                    ]
                );
            }
        } finally {
            if (is_resource($audioStream)) {
                fclose($audioStream);
            }
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
            $concern = Concern::find($concernId);
            if ($concern) {
                $this->applyAiFailureFallback(
                    $concernService,
                    $concern,
                    'Voice analysis failed after multiple attempts.',
                    [
                        'fallback_source' => 'voice_job_failed_after_retries',
                        'exception' => get_class($exception),
                    ]
                );
            }
        }
    }

    private function applyAiFailureFallback(\App\Services\ConcernService $concernService, Concern $concern, string $reason, array $meta = []): void
    {
        if (in_array($concern->status, ['rejected', 'resolved', 'awaiting_confirmation'], true)) {
            Log::info('ProcessVoiceConcernJob: Skipping fallback update for terminal concern state', [
                'concern_id' => $concern->id,
                'status' => $concern->status,
            ]);

            return;
        }

        $fallbackRaw = [
            'is_fallback' => true,
            'fallback_source' => $meta['fallback_source'] ?? 'voice_ai_fallback',
            'gemini_status' => $meta['gemini_status'] ?? null,
            'gemini_error' => $reason,
            'attempts' => $meta['attempts'] ?? null,
            'timestamp' => now()->toIso8601String(),
            'meta' => $meta,
        ];

        $concern->update([
            'title' => 'Ulat ng Mamamayan (Voice)',
            'description' => 'Naisumiteng voice concern. Sinusuri ng aming team.',
            'transcript_text' => $concern->transcript_text ?: 'Transcription unavailable. Please listen to the attached audio.',
            'is_valid' => true,
            'status' => 'pending',
            'rejection_reason' => null,
            'ai_processed_at' => now(),
            'ai_analysis_raw' => $fallbackRaw,
        ]);

        $concernService->assignWithoutDeduplication($concern->id, 'Voice concern queued after AI fallback.');
    }
}
