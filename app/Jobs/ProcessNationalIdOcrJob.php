<?php

namespace App\Jobs;

use App\Models\IdVerification;
use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use App\Services\RegistrationEligibilityService;
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
    public function handle(
        GeminiService $geminiService,
        ImageProcessingService $imageProcessingService,
        RegistrationEligibilityService $registrationEligibilityService
    ): void
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
                'failure_code' => 'ID_IMAGE_MISSING',
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
            $hasBackSide = (bool) ($analysis['backSideDetected'] ?? false);
            $isAuthentic = (bool) ($analysis['isAuthentic'] ?? false);
            $hasPcn = ! empty($analysis['data']['pcnNumber']);

            $failureCode = null;
            $failureReason = null;
            $eligibilityFlags = [];

            if ($hasBackSide) {
                $failureCode = 'BACK_SIDE_DETECTED';
                $failureReason = 'You uploaded the back of the ID. Please upload the front.';
            } elseif (! $isAuthentic) {
                $failureCode = 'ID_NOT_AUTHENTIC';
                $failureReason = (string) ($analysis['reasoning'] ?? 'ID verification failed. Please upload a clearer photo.');
            } elseif (! $hasPcn) {
                $failureCode = 'PCN_NOT_DETECTED';
                $failureReason = 'Could not detect PCN from the ID. Please upload a clearer front image.';
            } else {
                $eligibility = $registrationEligibilityService->evaluate(
                    $analysis,
                    $verification->request_latitude,
                    $verification->request_longitude
                );

                $eligibilityFlags = $eligibility['flags'] ?? [];
                if (! ($eligibility['eligible'] ?? false)) {
                    $failureCode = $eligibility['failureCode'] ?? 'REGISTRATION_NOT_ELIGIBLE';
                    $failureReason = $eligibility['failureReason'] ?? 'ID verification failed.';
                }
            }

            $isValid = $failureCode === null;

            $verification->update([
                'status' => $isValid ? 'completed' : 'failed',
                'result_json' => $analysis,
                'confidence' => isset($analysis['confidence']) ? max(0, min((int) $analysis['confidence'], 100)) : null,
                'flags' => [
                    'back_side_detected' => $hasBackSide,
                    'is_authentic' => $isAuthentic,
                    'is_outside_allowed_area' => $failureCode === 'OUTSIDE_176_BOUNDARY',
                    'pcn_detected' => $hasPcn,
                    'used_location_fallback' => (bool) ($eligibilityFlags['used_location_fallback'] ?? false),
                    'capture_location_missing' => (bool) ($eligibilityFlags['capture_location_missing'] ?? false),
                    'is_phase9_resident' => (bool) ($eligibilityFlags['is_phase9_resident'] ?? false),
                    'within_boundary' => (bool) ($eligibilityFlags['within_boundary'] ?? false),
                    'pcn_already_registered' => (bool) ($eligibilityFlags['pcn_already_registered'] ?? false),
                ],
                'failure_code' => $isValid ? null : $failureCode,
                'failure_reason' => $isValid ? null : $failureReason,
                'processed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('ProcessNationalIdOcrJob failed', [
                'id_verification_id' => $verification->id,
                'error' => $e->getMessage(),
            ]);

            $verification->update([
                'status' => 'failed',
                'failure_code' => 'OCR_PROCESSING_ERROR',
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
