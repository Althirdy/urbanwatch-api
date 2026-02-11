<?php

namespace Tests\Unit\Jobs;

use App\Jobs\ProcessNationalIdOcrJob;
use App\Models\IdVerification;
use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Mockery\MockInterface;
use Tests\TestCase;

class ProcessNationalIdOcrJobTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_it_marks_verification_completed_and_cleans_up_temp_image(): void
    {
        $verificationId = (string) \Illuminate\Support\Str::uuid();
        $imagePath = "ocr-temp/{$verificationId}.jpg";
        Storage::disk('local')->put($imagePath, 'fake-image-content');

        $verification = IdVerification::create([
            'verification_id' => $verificationId,
            'status' => 'pending',
            'image_disk' => 'local',
            'image_path' => $imagePath,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->mock(ImageProcessingService::class, function (MockInterface $mock) {
            $mock->shouldReceive('optimizeForAi')
                ->once()
                ->andReturn('optimized-image-content');
        });

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('analyzeNationalId')
                ->once()
                ->andReturn([
                    'backSideDetected' => false,
                    'isAuthentic' => true,
                    'isOutsideAllowedArea' => false,
                    'confidence' => 98,
                    'data' => [
                        'pcnNumber' => '1234-5678-9012-3456',
                        'firstName' => 'Juan',
                    ],
                ]);
        });

        $job = new ProcessNationalIdOcrJob($verification->id);
        $job->handle(app(GeminiService::class), app(ImageProcessingService::class));

        $verification->refresh();
        $this->assertSame('completed', $verification->status);
        $this->assertNull($verification->image_path);
        $this->assertNotNull($verification->processed_at);
        $this->assertNotNull($verification->deleted_image_at);
        $this->assertSame(98, $verification->confidence);
        Storage::disk('local')->assertMissing($imagePath);
    }

    public function test_it_marks_verification_failed_when_gemini_throws_and_still_cleans_image(): void
    {
        $verificationId = (string) \Illuminate\Support\Str::uuid();
        $imagePath = "ocr-temp/{$verificationId}.jpg";
        Storage::disk('local')->put($imagePath, 'fake-image-content');

        $verification = IdVerification::create([
            'verification_id' => $verificationId,
            'status' => 'pending',
            'image_disk' => 'local',
            'image_path' => $imagePath,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->mock(ImageProcessingService::class, function (MockInterface $mock) {
            $mock->shouldReceive('optimizeForAi')
                ->once()
                ->andReturn('optimized-image-content');
        });

        $this->mock(GeminiService::class, function (MockInterface $mock) {
            $mock->shouldReceive('analyzeNationalId')
                ->once()
                ->andThrow(new \RuntimeException('Gemini failure'));
        });

        $job = new ProcessNationalIdOcrJob($verification->id);
        $job->handle(app(GeminiService::class), app(ImageProcessingService::class));

        $verification->refresh();
        $this->assertSame('failed', $verification->status);
        $this->assertNull($verification->image_path);
        $this->assertNotNull($verification->processed_at);
        $this->assertNotNull($verification->deleted_image_at);
        $this->assertSame('Unable to process ID at this time. Please try again.', $verification->failure_reason);
        Storage::disk('local')->assertMissing($imagePath);
    }
}
