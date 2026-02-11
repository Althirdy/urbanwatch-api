<?php

namespace App\Services;

use App\Models\IdVerification;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class IdVerificationService
{
    protected string $disk = 'local';

    protected int $ttlMinutes = 15;

    public function start(UploadedFile $image, ?string $requestIp, ?string $deviceFingerprint): IdVerification
    {
        $verificationId = (string) Str::uuid();
        $extension = $image->getClientOriginalExtension() ?: 'jpg';
        $imagePath = "ocr-temp/{$verificationId}.{$extension}";

        Storage::disk($this->disk)->put($imagePath, $image->getContent());

        return IdVerification::create([
            'verification_id' => $verificationId,
            'status' => 'pending',
            'image_disk' => $this->disk,
            'image_path' => $imagePath,
            'request_ip' => $requestIp,
            'device_fingerprint' => $deviceFingerprint,
            'expires_at' => now()->addMinutes($this->ttlMinutes),
        ]);
    }

    public function markExpiredIfNeeded(IdVerification $verification): IdVerification
    {
        if (in_array($verification->status, ['completed', 'failed', 'expired'], true)) {
            return $verification;
        }

        if ($verification->expires_at && Carbon::parse($verification->expires_at)->isPast()) {
            $verification->update([
                'status' => 'expired',
                'failure_reason' => 'Verification request expired. Please upload your ID again.',
            ]);
            $this->deleteTemporaryImage($verification);
            $verification->refresh();
        }

        return $verification;
    }

    public function deleteTemporaryImage(IdVerification $verification): void
    {
        if (! $verification->image_path || $verification->deleted_image_at) {
            return;
        }

        Storage::disk($verification->image_disk ?: $this->disk)->delete($verification->image_path);
        $verification->update([
            'image_path' => null,
            'deleted_image_at' => now(),
        ]);
    }
}
