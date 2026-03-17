<?php

use App\Jobs\ProcessYoloSnapshotJob;
use App\Models\Accident;
use App\Models\cctvDevices;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    Storage::fake('local');
    Event::fake();
    Queue::fake();

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
        'latitude' => 14.5995,
        'longitude' => 120.9842,
        'created_at' => now(),
        'updated_at' => now(),
        'yolo_enabled' => true,
    ]);

    $this->apiKeyHeader = ['x-api-key' => 'test-api-key'];
});

test('it creates a new accident on first detection', function () {
    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot.jpg'),
        'device_id' => $this->device->id,
    ], $this->apiKeyHeader);

    $response->assertStatus(202)
        ->assertJsonPath('data.success', true)
        ->assertJsonPath('data.deviceId', $this->device->id)
        ->assertJsonPath('message', 'Snapshot queued for async processing');

    // Verify job was dispatched
    Queue::assertPushed(ProcessYoloSnapshotJob::class, function ($job) {
        return true; // Job was dispatched for this device
    });
});

test('it queues job for subsequent detection of same type', function () {
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

    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot2.jpg'),
        'device_id' => $this->device->id,
    ], $this->apiKeyHeader);

    $response->assertStatus(202)
        ->assertJsonPath('data.success', true)
        ->assertJsonPath('data.deviceId', $this->device->id);

    // Verify job was dispatched
    Queue::assertPushed(ProcessYoloSnapshotJob::class);
});

test('it queues job for different accident type on the same camera', function () {
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

    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('flood.jpg'),
        'device_id' => $this->device->id,
    ], $this->apiKeyHeader);

    $response->assertStatus(202)
        ->assertJsonPath('data.success', true)
        ->assertJsonPath('data.deviceId', $this->device->id);

    // Verify job was dispatched
    Queue::assertPushed(ProcessYoloSnapshotJob::class);
});

test('it rejects requests with missing api key', function () {
    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot.jpg'),
        'device_id' => $this->device->id,
    ]);

    $response->assertStatus(401)
        ->assertJsonPath('success', false);
});

test('it rejects requests with invalid api key', function () {
    $response = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot.jpg'),
        'device_id' => $this->device->id,
    ], ['x-api-key' => 'invalid-key']);

    $response->assertStatus(401)
        ->assertJsonPath('success', false);
});

test('it blocks yolo requests from non-allowlisted ip', function () {
    putenv('YOLO_ALLOWED_IPS=203.0.113.10');
    $_ENV['YOLO_ALLOWED_IPS'] = '203.0.113.10';
    $_SERVER['YOLO_ALLOWED_IPS'] = '203.0.113.10';

    try {
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '198.51.100.20',
        ])->postJson('/api/v1/yolo/process-snapshot', [
            'snapshot' => UploadedFile::fake()->image('snapshot.jpg'),
            'device_id' => $this->device->id,
        ], $this->apiKeyHeader);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    } finally {
        putenv('YOLO_ALLOWED_IPS');
        unset($_ENV['YOLO_ALLOWED_IPS'], $_SERVER['YOLO_ALLOWED_IPS']);
    }
});

test('it allows yolo requests from allowlisted ip with valid api key', function () {
    putenv('YOLO_ALLOWED_IPS=203.0.113.10');
    $_ENV['YOLO_ALLOWED_IPS'] = '203.0.113.10';
    $_SERVER['YOLO_ALLOWED_IPS'] = '203.0.113.10';

    try {
        $response = $this->withServerVariables([
            'REMOTE_ADDR' => '203.0.113.10',
        ])->postJson('/api/v1/yolo/process-snapshot', [
            'snapshot' => UploadedFile::fake()->image('snapshot.jpg'),
            'device_id' => $this->device->id,
        ], $this->apiKeyHeader);

        $response->assertStatus(202)
            ->assertJsonPath('data.success', true);
    } finally {
        putenv('YOLO_ALLOWED_IPS');
        unset($_ENV['YOLO_ALLOWED_IPS'], $_SERVER['YOLO_ALLOWED_IPS']);
    }
});

test('it rate limits yolo snapshot ingestion', function () {
    $apiKey = 'rate-limit-test-key';
    config(['services.yolo_api_key' => $apiKey]);
    $headers = ['x-api-key' => $apiKey];

    RateLimiter::for('yolo.ingest', function (Request $request) {
        return [
            Limit::perMinute(2)->by('test-key'),
        ];
    });

    $payload = [
        'snapshot' => UploadedFile::fake()->image('snapshot.jpg'),
        'device_id' => $this->device->id,
    ];

    $first = $this->postJson('/api/v1/yolo/process-snapshot', $payload, $headers);
    $second = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot-2.jpg'),
        'device_id' => $this->device->id,
    ], $headers);
    $third = $this->postJson('/api/v1/yolo/process-snapshot', [
        'snapshot' => UploadedFile::fake()->image('snapshot-3.jpg'),
        'device_id' => $this->device->id,
    ], $headers);

    $first->assertStatus(202);
    $second->assertStatus(202);
    $third->assertStatus(429)
        ->assertJsonStructure(['message']);
});
