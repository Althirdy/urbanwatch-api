<?php

namespace App\Jobs;

use App\Events\ConcernTranscribed;
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

    protected $concernId;

    /**
     * Create a new job instance.
     */
    public function __construct($concernId)
    {
        $this->concernId = $concernId;
    }

    /**
     * Execute the job.
     */
    public function handle(GeminiService $geminiService, \App\Services\ConcernService $concernService)
    {
        try {
            $concern = Concern::with(['media' => function ($query) {
                $query->where('media_type', 'audio')->orderBy('created_at', 'desc');
            }])->find($this->concernId);

            if (! $concern) {
                Log::error('ProcessVoiceConcernJob: Concern not found', ['concern_id' => $this->concernId]);

                return;
            }

            // Find the audio file
            $audioMedia = $concern->media->first();

            if (! $audioMedia) {
                Log::warning('ProcessVoiceConcernJob: No audio media found for concern', ['concern_id' => $concern->id]);

                // Still finalize even if media is missing
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

                return;
            }

            $fileContent = Storage::disk($disk)->get($storagePath);
            $mimeType = $audioMedia->mime_type ?? 'audio/mp3'; // Default fallback

            // Call Gemini Service - now includes category and severity analysis
            $analysis = $geminiService->analyzeAudio($fileContent, $mimeType);

            if ($analysis) {
                // Prepare update data with transcription
                $updateData = [
                    'title' => $analysis['title'] ?? $concern->title,
                    'description' => $analysis['description'] ?? $concern->description,
                    'transcript_text' => $analysis['transcription_text'] ?? null,
                ];

                // Add AI category and severity if available from audio analysis
                if (isset($analysis['category']) && isset($analysis['severity'])) {
                    $updateData['ai_category'] = $analysis['category'];
                    $updateData['ai_severity'] = $analysis['severity'];
                    $updateData['ai_confidence'] = $analysis['confidence'] ?? 0.95;
                    $updateData['ai_processed_at'] = now();

                    // If confidence is high enough, update the main category and severity
                    $confidenceThreshold = 0.7;
                    if (isset($analysis['confidence']) && $analysis['confidence'] >= $confidenceThreshold) {
                        $updateData['category'] = $analysis['category'];
                        $updateData['severity'] = $analysis['severity'];
                    }

                    Log::info('ProcessVoiceConcernJob: Category and severity detected from audio', [
                        'concern_id' => $concern->id,
                        'category' => $analysis['category'],
                        'severity' => $analysis['severity'],
                        'confidence' => $analysis['confidence'] ?? 0.95,
                    ]);
                }

                // Update concern with all data
                $concern->update($updateData);

                Log::info('ProcessVoiceConcernJob: Concern updated with transcription and AI analysis', [
                    'concern_id' => $concern->id,
                    'has_category' => isset($analysis['category']),
                ]);

                // Refresh to get latest data
                $concern->refresh();
                // $concern->load('distribution'); // Distribution not created yet

                // Fire AI Category Updated Event if we have AI data
                if (isset($analysis['category']) && isset($analysis['severity'])) {
                    Log::info('ProcessVoiceConcernJob: Firing ConcernAICategoryUpdated event', [
                        'concern_id' => $concern->id,
                        'category' => $concern->category,
                        'severity' => $concern->severity,
                        'ai_category' => $concern->ai_category,
                        'ai_severity' => $concern->ai_severity,
                    ]);

                    event(new \App\Events\ConcernAICategoryUpdated($concern));

                    Log::info('ProcessVoiceConcernJob: ConcernAICategoryUpdated event fired');
                }

                // Fire Transcribed Event
                Log::info('ProcessVoiceConcernJob: Firing ConcernTranscribed event', [
                    'concern_id' => $concern->id,
                ]);

                event(new ConcernTranscribed($concern));

                Log::info('ProcessVoiceConcernJob: ConcernTranscribed event fired');
            } else {
                Log::warning('ProcessVoiceConcernJob: Gemini analysis failed or returned null', [
                    'concern_id' => $concern->id,
                ]);
            }

        } catch (\Exception $e) {
            Log::error('ProcessVoiceConcernJob: Error processing voice concern', [
                'concern_id' => $this->concernId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        } finally {
            // Finalize the concern (Deduplication -> Assignment -> Notification)
            Log::info('ProcessVoiceConcernJob: Finalizing concern', ['concern_id' => $this->concernId]);
            $concernService->finalizeConcern($this->concernId);
        }
    }
}
