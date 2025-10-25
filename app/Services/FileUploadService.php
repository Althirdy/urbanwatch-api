<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class FileUploadService
{
    /**
     * Upload a single file.
     */
    public function uploadSingle($file, $directory = 'uploads')
    {
        $path = $file->store($directory, 's3'); // or 'r2' if you're using Cloudflare
        $publicUrl = Storage::disk('s3')->url($path);

        return [
            'public_url' => $publicUrl,
            'storage_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
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
