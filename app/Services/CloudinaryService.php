<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    private string $cloudName;
    private string $uploadPreset;
    private string $uploadUrl;

    public function __construct()
    {
        $this->cloudName = config('app.cloudinary_cloud_name', env('CLOUDINARY_CLOUD_NAME'));
        $this->uploadPreset = config('app.cloudinary_upload_preset', env('CLOUDINARY_UNSIGNED_UPLOAD_PRESET'));
        $this->uploadUrl = "https://api.cloudinary.com/v1_1/{$this->cloudName}/upload";
    }

    /**
     * Upload a single file to Cloudinary
     */
    public function uploadFile(UploadedFile $file, ?string $folder = null): ?array
    {
        try {
            if (!$this->validateFile($file)) {
                Log::warning('Invalid file skipped for upload', [
                    'filename' => $file->getClientOriginalName(),
                ]);
                return null;
            }

            $multipartData = [
                [
                    'name' => 'file',
                    'contents' => fopen($file->getRealPath(), 'r'),
                    'filename' => $file->getClientOriginalName(),
                ],
                [
                    'name' => 'upload_preset',
                    'contents' => $this->uploadPreset,
                ],
                [
                    'name' => 'public_id',
                    'contents' => 'upload_' . time() . '_' . uniqid(),
                ],
            ];

            if ($folder) {
                $multipartData[] = [
                    'name' => 'folder',
                    'contents' => $folder,
                ];
            }

            $response = Http::timeout(30)
                ->retry(3, 200)
                ->asMultipart()
                ->post($this->uploadUrl, $multipartData);

            if ($response->successful()) {
                $result = $response->json();

                Log::info('✅ File uploaded successfully to Cloudinary', [
                    'public_id' => $result['public_id'] ?? null,
                    'secure_url' => $result['secure_url'] ?? null,
                ]);

                return $result;
            }

            Log::error('❌ Cloudinary upload failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'filename' => $file->getClientOriginalName(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('❌ Exception during Cloudinary upload', [
                'error' => $e->getMessage(),
                'filename' => $file->getClientOriginalName(),
            ]);
            return null;
        }
    }

    /**
     * Upload multiple files to Cloudinary in parallel
     */
    public function uploadMultipleFiles(array $files, ?string $folder = null): array
    {
        $results = [
            'successful' => [],
            'failed' => [],
        ];

        // Validate files first
        $validFiles = [];
        foreach ($files as $index => $file) {
            if (!$file instanceof UploadedFile) {
                $results['failed'][] = [
                    'index' => $index,
                    'error' => 'Invalid file type',
                ];
                continue;
            }
            $validFiles[$index] = $file;
        }

        if (empty($validFiles)) {
            return $results;
        }

        // For now, let's fall back to sequential uploads to avoid the array key issue
        // TODO: Implement proper parallel uploads later
        foreach ($validFiles as $index => $file) {
            $uploadResult = $this->uploadFile($file, $folder);

            if ($uploadResult) {
                $results['successful'][] = [
                    'index' => $index,
                    'original_filename' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'secure_url' => $uploadResult['secure_url'] ?? null,
                    'public_id' => $uploadResult['public_id'] ?? null,
                ];
            } else {
                $results['failed'][] = [
                    'index' => $index,
                    'error' => 'Upload failed',
                    'filename' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ];
            }
        }

        Log::info('🚀 Multiple file upload completed', [
            'total_files' => count($validFiles),
            'successful' => count($results['successful']),
            'failed' => count($results['failed']),
        ]);

        return $results;
    }

    /**
     * Delete a file (requires signed API)
     */
    public function deleteFile(string $publicId): bool
    {
        Log::warning('Cloudinary delete requires signed API setup', [
            'public_id' => $publicId,
        ]);
        return false;
    }

    /**
     * Generate transformed URL
     */
    public function getTransformedUrl(string $publicId, array $transformations = []): string
    {
        $baseUrl = "https://res.cloudinary.com/{$this->cloudName}/image/upload/";
        return !empty($transformations)
            ? $baseUrl . implode(',', $transformations) . '/' . $publicId
            : $baseUrl . $publicId;
    }

    /**
     * Validate file (size & type)
     */
    private function validateFile(UploadedFile $file): bool
    {
        if ($file->getSize() > 5 * 1024 * 1024) { // 5MB
            return false;
        }

        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
        return in_array($file->getMimeType(), $allowedMimes);
    }
}
