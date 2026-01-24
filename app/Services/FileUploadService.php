<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class FileUploadService
{
    /**
     * Upload a single file with optimization for images.
     */
    public function uploadSingle($file, $directory = 'uploads')
    {
        // Use default disk
        $disk = config('filesystems.default');

        // Safety Fallback: If configured for S3 but no bucket is defined, fallback to public
        if ($disk === 's3' && empty(config('filesystems.disks.s3.bucket'))) {
            $disk = 'public';
        }

        // If default is 'local', force 'public' for accessibility
        if ($disk === 'local') {
            $disk = 'public';
        }

        $mimeType = $file->getMimeType();
        $originalFilename = $file->getClientOriginalName();
        $path = '';

        // Optimization for Images
        if (str_starts_with($mimeType, 'image/') && $mimeType !== 'image/gif') {
            try {
                $manager = new ImageManager(new Driver);
                $image = $manager->read($file);

                // 1. Scrub EXIF & Resize (Max Width 1200px)
                $image->scale(width: 1200);

                // 2. Generate optimized filename
                $filename = pathinfo($originalFilename, PATHINFO_FILENAME).'_'.uniqid().'.jpg';
                $path = $directory.'/'.$filename;

                // 3. Compress and Store (Quality 80)
                $encoded = $image->toJpeg(80);
                Storage::disk($disk)->put($path, (string) $encoded);

                $fileSize = strlen((string) $encoded);
                $mimeType = 'image/jpeg'; // Standardized to jpeg
            } catch (\Exception $e) {
                // Fallback to original if optimization fails
                $path = $file->store($directory, $disk);
                $fileSize = $file->getSize();
            }
        } else {
            // Non-image files or GIFs (stored as-is)
            $path = $file->store($directory, $disk);
            $fileSize = $file->getSize();
        }

        $publicUrl = Storage::disk($disk)->url($path);

        return [
            'public_url' => $publicUrl,
            'storage_path' => $path,
            'original_filename' => $originalFilename,
            'file_size' => $fileSize,
            'mime_type' => $mimeType,
        ];
    }

    /**
     * Upload multiple files.
     */
    public function uploadMultiple($files, $directory = 'uploads')
    {
        $results = [];

        foreach ($files as $file) {
            $upload = $this->uploadSingle($file, $directory);
            $results[] = $upload;
        }

        return [
            'successful' => $results,
        ];
    }
}
