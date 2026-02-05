<?php

use App\Events\AccidentDetected;
use App\Events\AccidentUpdated;
use App\Models\Accident;
use App\Models\cctvDevices;
use App\Models\IncidentMedia;
use App\Services\FileUploadService;
use App\Services\GeminiService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    Event::fake();

    // Setup configuration
    config(['services.yolo_api_key' => 'test-api-key']);

    // Create seed data
    $this->device = cctvDevices::create([
        'location_name' => 'Test Junction',
        'device_name' => 'CCTV-BH-001',
        'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.101:554/stream1',
        'backup_rtsp_url' => 'rtsp://admin:admin123@192.168.1.101:554/stream2',
        'status' => 'Active',
        'installation_date' => '2024-01-15',
        'created_at' => now(),
        'updated_at' => now(),
        'yolo_enabled' => true,
    ]);

    $this->apiKeyHeader = ['x-api-key' => 'test-api-key'];
});

test('it creates a new accident on first detection', function () {
    $mockGemini = Mockery::mock(GeminiService::class);
    $mockGemini->shouldReceive('analyzeImage')->andReturn([
        'is_valid' => true,
        'accident_type' => 'Accident',
        'severity' => 'Medium',
        'title' => 'DEMO: Car Crash',
        'description' => 'DEMO: Two cars collided',
        'confidence' => 90,
        'detected_objects' => ['car'],
        'reasoning' => 'Visual evidence of collision',
    ]);

    $mockFileUpload = Mockery::mock(FileUploadService::class);
    $mockFileUpload->shouldReceive('uploadSingle')->andReturn([
        'public_url' => 'http://test.com/image.jpg',
        'storage_path' => 'yolo/image',
        'original_filename' => 'snapshot.jpg',
        'file_size' => 1024,
        'mime_type' => 'image/jpeg',
    ]);

    $this->app->instance(GeminiService::class, $mockGemini);
    $this->app->instance(FileUploadService::class, $mockFileUpload);

    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot.jpg'),
        'device_id' => $this->device->id,
    ], $this->apiKeyHeader);

    $response->assertStatus(201)
        ->assertJsonPath('data.isNew', true)
        ->assertJsonPath('data.accidentType', 'Accident');

    expect(Accident::count())->toBe(1);
    expect(IncidentMedia::count())->toBe(1);

    Event::assertDispatched(AccidentDetected::class);
});

test('it updates existing accident on subsequent detection of same type', function () {
    // 1. Create initial accident
    $accident = Accident::create([
        'cctv_device_id' => $this->device->id,
        'accident_type' => 'Accident',
        'status' => 'Pending',
        'severity' => 'Low',
        'title' => 'Old Title',
        'description' => 'Old Description',
        'latitude' => 14.5995,
        'longitude' => 120.9842,
        'occurred_at' => now(),
    ]);

    $mockGemini = Mockery::mock(GeminiService::class);
    $mockGemini->shouldReceive('analyzeImage')->andReturn([
        'is_valid' => true,
        'accident_type' => 'Accident', // Same type
        'severity' => 'High', // Escalated
        'title' => 'DEMO: Serious Crash',
        'description' => 'DEMO: High confidence detection',
        'confidence' => 95,
        'detected_objects' => ['car'],
        'reasoning' => 'Confirmed collision',
    ]);

    $mockFileUpload = Mockery::mock(FileUploadService::class);
    $mockFileUpload->shouldReceive('uploadSingle')->andReturn([
        'public_url' => 'http://test.com/image2.jpg',
        'storage_path' => 'yolo/image2',
    ]);

    $this->app->instance(GeminiService::class, $mockGemini);
    $this->app->instance(FileUploadService::class, $mockFileUpload);

    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot2.jpg'),
        'device_id' => $this->device->id,
    ], $this->apiKeyHeader);

    $response->assertStatus(201)
        ->assertJsonPath('data.isNew', false)
        ->assertJsonPath('data.accidentId', $accident->id)
        ->assertJsonPath('data.severity', 'High');

    expect(Accident::count())->toBe(1);
    expect(IncidentMedia::count())->toBe(1); // One new media attached to the accident

    $accident->refresh();
    expect(strtolower($accident->severity))->toBe('high');
    expect($accident->title)->toBe('DEMO: Serious Crash');

    Event::assertDispatched(AccidentUpdated::class);
});

test('it creates a new card for a different accident type on the same camera', function () {
    // 1. Create existing Car Accident
    Accident::create([
        'cctv_device_id' => $this->device->id,
        'accident_type' => 'Accident',
        'status' => 'Pending',
        'severity' => 'Low',
        'title' => 'Car Crash',
        'description' => 'Two cars collided',
        'latitude' => 14.5995,
        'longitude' => 120.9842,
        'occurred_at' => now(),
    ]);

    // 2. Mock a Flood detection
    $mockGemini = Mockery::mock(GeminiService::class);
    $mockGemini->shouldReceive('analyzeImage')->andReturn([
        'is_valid' => true,
        'accident_type' => 'Flood', // Different type
        'severity' => 'Medium',
        'title' => 'DEMO: Baha',
        'description' => 'DEMO: Mataas ang baha',
        'confidence' => 80,
        'detected_objects' => ['water'],
        'reasoning' => 'Visual evidence of flood',
    ]);

    $mockFileUpload = Mockery::mock(FileUploadService::class);
    $mockFileUpload->shouldReceive('uploadSingle')->andReturn([
        'public_url' => 'http://test.com/flood.jpg',
        'storage_path' => 'yolo/flood',
    ]);

    $this->app->instance(GeminiService::class, $mockGemini);
    $this->app->instance(FileUploadService::class, $mockFileUpload);

    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('flood.jpg'),
        'device_id' => $this->device->id,
    ], $this->apiKeyHeader);

    $response->assertStatus(201)
        ->assertJsonPath('data.isNew', true)
        ->assertJsonPath('data.accidentType', 'Flood');

    expect(Accident::count())->toBe(2); // One Accident, One Flood
    Event::assertDispatched(AccidentDetected::class);
});
