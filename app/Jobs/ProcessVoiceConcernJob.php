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

                // Fallback: Default to valid
                $concernService->markAsValid($concern->id, []);
            }

        } catch (\Exception $e) {
            Log::error('ProcessVoiceConcernJob: Error processing voice concern', [
                'concern_id' => $this->concernId,
                'error' => $e->getMessage(),
            ]);

            // Fallback: Update with error text
            $concern = Concern::find($this->concernId);
            if ($concern) {
                $concern->update([
                    'transcript_text' => 'Transcription unavailable due to system error.',
                ]);
            }

            // Fallback: Mark as valid
            $concernService->markAsValid($this->concernId, []);
        }
    }
}
