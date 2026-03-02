<?php

namespace Tests\Unit\Support;

use App\Support\VoiceAudioFileSupport;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class VoiceAudioFileSupportTest extends TestCase
{
    public function test_it_accepts_supported_audio_mime_type(): void
    {
        $file = UploadedFile::fake()->create('recording.bin', 100, 'audio/webm');

        $this->assertTrue(VoiceAudioFileSupport::isSupportedUpload($file));
    }

    public function test_it_accepts_supported_extension_with_generic_mime_type(): void
    {
        $file = UploadedFile::fake()->create('recording.m4a', 100, 'application/octet-stream');

        $this->assertTrue(VoiceAudioFileSupport::isSupportedUpload($file));
    }

    public function test_it_rejects_unsupported_mime_and_extension(): void
    {
        $file = UploadedFile::fake()->create('recording.txt', 100, 'text/plain');

        $this->assertFalse(VoiceAudioFileSupport::isSupportedUpload($file));
    }

    public function test_it_handles_uppercase_extension_fallback(): void
    {
        $file = UploadedFile::fake()->create('RECORDING.MP3', 100, 'application/octet-stream');

        $this->assertTrue(VoiceAudioFileSupport::isSupportedUpload($file));
    }

    public function test_it_detects_image_mime_types(): void
    {
        $this->assertTrue(VoiceAudioFileSupport::isImageMime('image/jpeg'));
        $this->assertFalse(VoiceAudioFileSupport::isImageMime('application/json'));
    }
}
