<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;

final class VoiceAudioFileSupport
{
    private const SUPPORTED_AUDIO_MIME_TYPES = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/wave',
        'audio/aac',
        'audio/x-aac',
        'audio/mp4',
        'audio/x-m4a',
        'audio/3gpp',
        'audio/3gpp2',
        'audio/ogg',
        'audio/opus',
        'audio/webm',
        'application/ogg',
    ];

    private const SUPPORTED_AUDIO_EXTENSIONS = [
        'mp3',
        'wav',
        'm4a',
        'aac',
        'mp4',
        '3gp',
        '3gpp',
        'ogg',
        'opus',
        'webm',
        'caf',
    ];

    private const SUPPORTED_VIDEO_EXTENSIONS = [
        'mp4',
        'mov',
        'm4v',
        'webm',
        '3gp',
        '3gpp',
        'mkv',
    ];

    public static function isSupportedUpload(UploadedFile $file): bool
    {
        return self::isSupportedMimeOrExtension($file->getMimeType(), $file->getClientOriginalName());
    }

    public static function isSupportedMimeOrExtension(?string $mimeType, ?string $fileName): bool
    {
        $normalizedMimeType = self::normalizeMimeType($mimeType);
        if ($normalizedMimeType !== '' && in_array($normalizedMimeType, self::SUPPORTED_AUDIO_MIME_TYPES, true)) {
            return true;
        }

        $extension = self::extractExtension($fileName);

        return $extension !== '' && in_array($extension, self::SUPPORTED_AUDIO_EXTENSIONS, true);
    }

    public static function isAudioMime(?string $mimeType): bool
    {
        $normalizedMimeType = self::normalizeMimeType($mimeType);
        if ($normalizedMimeType === '') {
            return false;
        }

        return str_starts_with($normalizedMimeType, 'audio/')
            || in_array($normalizedMimeType, self::SUPPORTED_AUDIO_MIME_TYPES, true);
    }

    public static function isImageMime(?string $mimeType): bool
    {
        return str_starts_with(self::normalizeMimeType($mimeType), 'image/');
    }

    public static function isVideoMime(?string $mimeType): bool
    {
        return str_starts_with(self::normalizeMimeType($mimeType), 'video/');
    }

    public static function isSupportedVideoUpload(UploadedFile $file): bool
    {
        return self::isVideoMimeOrExtension($file->getMimeType(), $file->getClientOriginalName());
    }

    public static function isVideoMimeOrExtension(?string $mimeType, ?string $fileName): bool
    {
        if (self::isVideoMime($mimeType)) {
            return true;
        }

        $extension = self::extractExtension($fileName);

        return $extension !== '' && in_array($extension, self::SUPPORTED_VIDEO_EXTENSIONS, true);
    }

    private static function normalizeMimeType(?string $mimeType): string
    {
        return strtolower(trim((string) $mimeType));
    }

    private static function extractExtension(?string $fileName): string
    {
        return strtolower((string) pathinfo((string) $fileName, PATHINFO_EXTENSION));
    }

    private function __construct() {}
}
