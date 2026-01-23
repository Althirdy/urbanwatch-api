<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class ImageProcessingService
{
    /**
     * Compress and optimize image for AI analysis.
     */
    public function optimizeForAi(string $fileContent, string $mimeType): string
    {
        try {
            $image = @imagecreatefromstring($fileContent);
            if ($image === false) {
                Log::warning('Image processing failed: Invalid image data');

                return $fileContent;
            }

            // 1. Fix Mobile Rotation (EXIF)
            if (function_exists('exif_read_data')) {
                $stream = 'data://application/octet-stream;base64,'.base64_encode($fileContent);
                $exif = @exif_read_data($stream);
                if (! empty($exif['Orientation'])) {
                    switch ($exif['Orientation']) {
                        case 3: $image = imagerotate($image, 180, 0);
                            break;
                        case 6: $image = imagerotate($image, -90, 0);
                            break;
                        case 8: $image = imagerotate($image, 90, 0);
                            break;
                    }
                }
            }

            // 2. Resize Logic
            $originalWidth = imagesx($image);
            $originalHeight = imagesy($image);
            $maxWidth = 1920;
            $maxHeight = 1920;

            if ($originalWidth <= $maxWidth && $originalHeight <= $maxHeight) {
                imagedestroy($image);

                return $fileContent;
            }

            $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
            $newWidth = (int) round($originalWidth * $ratio);
            $newHeight = (int) round($originalHeight * $ratio);

            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);

            // Handle Transparency
            if (str_contains($mimeType, 'png') || str_contains($mimeType, 'webp')) {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                $transparent = imagecolorallocatealpha($resizedImage, 0, 0, 0, 127);
                imagefilledrectangle($resizedImage, 0, 0, $newWidth, $newHeight, $transparent);
            }

            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);

            // 3. Export optimized
            ob_start();
            // Prefer WebP for AI if available, else JPEG
            if (function_exists('imagewebp')) {
                imagewebp($resizedImage, null, 80);
            } else {
                imagejpeg($resizedImage, null, 85);
            }
            $content = ob_get_clean();

            imagedestroy($image);
            imagedestroy($resizedImage);

            return $content;

        } catch (\Throwable $e) {
            Log::warning('Image optimization failed, using original', ['error' => $e->getMessage()]);

            return $fileContent;
        }
    }
}
