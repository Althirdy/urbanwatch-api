<?php

namespace App\Jobs;

use App\Models\IdVerification;
use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessNationalIdOcrJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public int $idVerificationId) {}

    /**
     * Execute the job.
     */
    public function handle(GeminiService $geminiService, ImageProcessingService $imageProcessingService): void
    {
        /** @var IdVerification|null $verification */
        $verification = IdVerification::find($this->idVerificationId);
        if (! $verification) {
            return;
        }

        if (in_array($verification->status, ['completed', 'failed', 'expired'], true)) {
            return;
        }

        if (! $verification->image_path) {
            $verification->update([
                'status' => 'failed',
                'failure_reason' => 'ID image is no longer available. Please upload again.',
                'processed_at' => now(),
            ]);

            return;
        }

        $verification->update(['status' => 'processing']);

        try {
            $disk = $verification->image_disk ?: 'local';
            if (! Storage::disk($disk)->exists($verification->image_path)) {
                throw new \RuntimeException('Temporary ID image file was not found.');
            }

            $rawContent = Storage::disk($disk)->get($verification->image_path);
            $mimeType = Storage::disk($disk)->mimeType($verification->image_path) ?: 'image/jpeg';
            $optimizedContent = $imageProcessingService->optimizeForAi($rawContent, $mimeType);

            $analysis = $geminiService->analyzeNationalId($optimizedContent, $mimeType);
            $isValid = ! ($analysis['backSideDetected'] ?? false)
                && (bool) ($analysis['isAuthentic'] ?? false)
                && ! ($analysis['isOutsideAllowedArea'] ?? false)
                && ! empty($analysis['data']['pcnNumber']);

            $verification->update([
                'status' => $isValid ? 'completed' : 'failed',
                'result_json' => $analysis,
                'confidence' => isset($analysis['confidence']) ? max(0, min((int) $analysis['confidence'], 100)) : null,
                'flags' => [
                    'back_side_detected' => (bool) ($analysis['backSideDetected'] ?? false),
                    'is_authentic' => (bool) ($analysis['isAuthentic'] ?? false),
                    'is_outside_allowed_area' => (bool) ($analysis['isOutsideAllowedArea'] ?? false),
                ],
                'failure_reason' => $isValid ? null : ($analysis['reasoning'] ?? 'ID verification failed. Please upload a clearer photo.'),
                'processed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProcessNationalIdOcrJob failed', [
                'id_verification_id' => $verification->id,
                'error' => $e->getMessage(),
            ]);

            $verification->update([
                'status' => 'failed',
                'failure_reason' => 'Unable to process ID at this time. Please try again.',
                'processed_at' => now(),
            ]);
        } finally {
            if ($verification->image_path) {
                Storage::disk($verification->image_disk ?: 'local')->delete($verification->image_path);
            }
            $verification->update([
                'image_path' => null,
                'deleted_image_at' => now(),
            ]);
        }
    }
}
