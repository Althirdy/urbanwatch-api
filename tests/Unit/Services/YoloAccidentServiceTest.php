<?php

namespace Tests\Unit\Services;

use App\Events\AccidentDetected;
use App\Events\AccidentUpdated;
use App\Models\Accident;
use App\Models\cctvDevices;
use App\Models\IncidentMedia;
use App\Services\FileUploadService;
use App\Services\GeminiService;
use App\Services\YoloAccidentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class YoloAccidentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected $yoloService;

    protected $geminiService;

    protected $fileUploadService;

    protected $device;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();

        $this->geminiService = Mockery::mock(GeminiService::class);
        $this->fileUploadService = Mockery::mock(FileUploadService::class);
        $this->routingService = Mockery::mock(\App\Services\GeographicRoutingService::class);
        $this->routingService->shouldIgnoreMissing();

        $this->yoloService = new YoloAccidentService(
            $this->geminiService,
            $this->fileUploadService,
            $this->routingService
        );

        $this->device = cctvDevices::create([
            'location_name' => 'Test Location',
            'device_name' => 'CCTV-BH-001',
            'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.101:554/stream1',
            'backup_rtsp_url' => 'rtsp://admin:admin123@192.168.1.101:554/stream2',
            'status' => 'Active',
            'installation_date' => '2024-01-15',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'created_at' => now(),
            'updated_at' => now(),
            'yolo_enabled' => true,
        ]);
    }

    public function test_it_creates_new_accident_when_none_exists()
    {
        $file = UploadedFile::fake()->image('test.jpg');

        $this->geminiService->shouldReceive('analyzeYoloImage')->andReturn([
            'overall_valid' => true,
            'reasoning' => 'Test reasoning',
            'class_verdicts' => [[
                'source_class' => 'Fire',
                'normalized_class' => 'Fire',
                'is_legit' => true,
                'accident_type' => 'Fire',
                'severity' => 'Low',
                'title' => 'Test Fire',
                'description' => 'Test Description',
                'confidence' => 90,
                'detected_objects' => ['fire'],
                'reasoning' => 'Test reasoning',
            ]],
        ]);

        $this->fileUploadService->shouldReceive('uploadSingle')->andReturn([
            'public_url' => 'http://test.com/fire.jpg',
            'storage_path' => 'yolo/fire.jpg',
        ]);

        $result = $this->yoloService->processDetection($file, $this->device->id);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['isNew']);
        $this->assertEquals('Fire', $result['accidentType']);
        $this->assertDatabaseHas('accidents', ['accident_type' => 'Fire']);
        Event::assertDispatched(AccidentDetected::class);
    }

    public function test_it_updates_existing_active_accident_of_same_type()
    {
        // Create an existing active accident
        $accident = Accident::create([
            'cctv_device_id' => $this->device->id,
            'accident_type' => 'Fire',
            'status' => 'Pending',
            'severity' => 'Low',
            'title' => 'Old Fire',
            'description' => 'Old Description',
            'latitude' => 10.0,
            'longitude' => 20.0,
            'occurred_at' => now()->subMinutes(5),
        ]);

        $file = UploadedFile::fake()->image('test2.jpg');

        $this->geminiService->shouldReceive('analyzeYoloImage')->andReturn([
            'overall_valid' => true,
            'reasoning' => 'Updated reasoning',
            'class_verdicts' => [[
                'source_class' => 'Fire',
                'normalized_class' => 'Fire',
                'is_legit' => true,
                'accident_type' => 'Fire',
                'severity' => 'High',
                'title' => 'Updated Fire',
                'description' => 'More intense fire',
                'confidence' => 95,
                'detected_objects' => ['fire'],
                'reasoning' => 'Updated reasoning',
            ]],
        ]);

        $this->fileUploadService->shouldReceive('uploadSingle')->andReturn([
            'public_url' => 'http://test.com/fire2.jpg',
            'storage_path' => 'yolo/fire2.jpg',
        ]);

        $result = $this->yoloService->processDetection($file, $this->device->id);

        $this->assertTrue($result['success']);
        $this->assertFalse($result['isNew']);
        $this->assertEquals($accident->id, $result['accidentId']);
        $this->assertEquals('High', $result['severity']);
        Event::assertDispatched(AccidentUpdated::class);

        // Verify only 1 accident exists but 1 new media record created
        $this->assertEquals(1, Accident::count());
        $this->assertEquals(1, IncidentMedia::where('source_id', $accident->id)->count());
    }

    public function test_it_does_not_merge_different_accident_types()
    {
        // Existing Fire
        Accident::create([
            'cctv_device_id' => $this->device->id,
            'accident_type' => 'Fire',
            'status' => 'Pending',
            'severity' => 'Low',
            'title' => 'Active Fire',
            'description' => 'Fire description',
            'latitude' => 10.0,
            'longitude' => 20.0,
            'occurred_at' => now(),
        ]);

        $file = UploadedFile::fake()->image('flood.jpg');

        // New Detection is Flood
        $this->geminiService->shouldReceive('analyzeYoloImage')->andReturn([
            'overall_valid' => true,
            'reasoning' => 'Flood reasoning',
            'class_verdicts' => [[
                'source_class' => 'Flood',
                'normalized_class' => 'Flood',
                'is_legit' => true,
                'accident_type' => 'Flood',
                'severity' => 'Medium',
                'title' => 'New Flood',
                'description' => 'Flood description',
                'confidence' => 80,
                'detected_objects' => ['water'],
                'reasoning' => 'Flood reasoning',
            ]],
        ]);

        $this->fileUploadService->shouldReceive('uploadSingle')->andReturn([
            'public_url' => 'http://test.com/flood.jpg',
            'storage_path' => 'yolo/flood.jpg',
        ]);

        $result = $this->yoloService->processDetection($file, $this->device->id);

        $this->assertTrue($result['isNew']);
        $this->assertEquals('Flood', $result['accidentType']);
        $this->assertEquals(2, Accident::count());
    }

    public function test_it_matches_lowercase_active_statuses_for_existing_accidents()
    {
        $accident = Accident::create([
            'cctv_device_id' => $this->device->id,
            'accident_type' => 'Fire',
            'status' => 'pending',
            'severity' => 'Low',
            'title' => 'Lowercase Pending Fire',
            'description' => 'Existing lowercase status accident',
            'latitude' => 10.0,
            'longitude' => 20.0,
            'occurred_at' => now()->subMinutes(5),
        ]);

        $file = UploadedFile::fake()->image('fire-lowercase.jpg');

        $this->geminiService->shouldReceive('analyzeYoloImage')->andReturn([
            'overall_valid' => true,
            'reasoning' => 'Updated lowercase status',
            'class_verdicts' => [[
                'source_class' => 'Fire',
                'normalized_class' => 'Fire',
                'is_legit' => true,
                'accident_type' => 'Fire',
                'severity' => 'Medium',
                'title' => 'Updated Fire',
                'description' => 'Should update existing lowercase status accident',
                'confidence' => 88,
                'detected_objects' => ['fire'],
                'reasoning' => 'Updated lowercase status',
            ]],
        ]);

        $this->fileUploadService->shouldReceive('uploadSingle')->andReturn([
            'public_url' => 'http://test.com/fire-lowercase.jpg',
            'storage_path' => 'yolo/fire-lowercase.jpg',
        ]);

        $result = $this->yoloService->processDetection($file, $this->device->id);

        $this->assertTrue($result['success']);
        $this->assertFalse($result['isNew']);
        $this->assertEquals($accident->id, $result['accidentId']);
        $this->assertEquals(1, Accident::count());
    }

    public function test_it_does_not_broadcast_accident_events_if_transaction_rolls_back()
    {
        $file = UploadedFile::fake()->image('rollback.jpg');

        $this->geminiService->shouldReceive('analyzeYoloImage')->andReturn([
            'overall_valid' => true,
            'reasoning' => 'Rollback path',
            'class_verdicts' => [[
                'source_class' => 'Fire',
                'normalized_class' => 'Fire',
                'is_legit' => true,
                'accident_type' => 'Fire',
                'severity' => 'Low',
                'title' => 'Rollback Fire',
                'description' => 'Should be rolled back',
                'confidence' => 90,
                'detected_objects' => ['fire'],
                'reasoning' => 'Rollback path',
            ]],
        ]);

        $this->fileUploadService->shouldReceive('uploadSingle')->andReturn([
            'public_url' => 'http://test.com/rollback.jpg',
            'storage_path' => 'yolo/rollback.jpg',
        ]);

        $service = Mockery::mock(YoloAccidentService::class, [
            $this->geminiService,
            $this->fileUploadService,
            $this->routingService,
        ])->makePartial();
        $service->shouldAllowMockingProtectedMethods();
        $service->shouldReceive('dispatchLeaderNotification')
            ->once()
            ->andThrow(new \RuntimeException('Forced rollback'));

        $this->expectException(\RuntimeException::class);

        try {
            $service->processDetection($file, $this->device->id);
        } finally {
            Event::assertNotDispatched(AccidentDetected::class);
            Event::assertNotDispatched(AccidentUpdated::class);
            $this->assertDatabaseCount('accidents', 0);
            $this->assertDatabaseCount('incident_media', 0);
        }
    }
}
