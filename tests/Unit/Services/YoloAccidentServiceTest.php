<?php

namespace Tests\Unit\Services;

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
            'created_at' => now(),
            'updated_at' => now(),
            'yolo_enabled' => true,
        ]);
    }

    public function test_it_creates_new_accident_when_none_exists()
    {
        $file = UploadedFile::fake()->image('test.jpg');

        $this->geminiService->shouldReceive('analyzeImage')->andReturn([
            'is_valid' => true,
            'accident_type' => 'Fire',
            'severity' => 'Low',
            'title' => 'Test Fire',
            'description' => 'Test Description',
            'confidence' => 90,
            'detected_objects' => ['fire'],
            'reasoning' => 'Test reasoning',
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

        $this->geminiService->shouldReceive('analyzeImage')->andReturn([
            'is_valid' => true,
            'accident_type' => 'Fire', // Same type
            'severity' => 'High', // Higher severity
            'title' => 'Updated Fire',
            'description' => 'More intense fire',
            'confidence' => 95,
            'detected_objects' => ['fire'],
            'reasoning' => 'Updated reasoning',
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
        $this->geminiService->shouldReceive('analyzeImage')->andReturn([
            'is_valid' => true,
            'accident_type' => 'Flood',
            'severity' => 'Medium',
            'title' => 'New Flood',
            'description' => 'Flood description',
            'confidence' => 80,
            'detected_objects' => ['water'],
            'reasoning' => 'Flood reasoning',
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
}
