<?php

namespace Tests\Unit;

use App\Models\AnomalyLog;
use App\Models\UwDevice;
use App\Services\UwDeviceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UwDeviceServiceTest extends TestCase
{
    use RefreshDatabase;

    protected UwDeviceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new UwDeviceService;
    }

    /** @test */
    public function it_can_create_a_device_with_an_api_token()
    {
        $data = [
            'device_id' => 12345,
            'device_name' => 'Test Device',
            'status' => 'active',
        ];

        $device = $this->service->createDevice($data);

        $this->assertInstanceOf(UwDevice::class, $device);
        $this->assertEquals('Test Device', $device->device_name);
        $this->assertNotNull($device->api_token);
        $this->assertStringStartsWith('uw_live_', $device->api_token);
        $this->assertDatabaseHas('uw_devices', [
            'device_id' => 12345,
            'device_name' => 'Test Device',
        ]);
    }

    /** @test */
    public function it_can_verify_a_device_and_update_heartbeat()
    {
        $device = UwDevice::factory()->create([
            'api_token' => 'test_token',
            'last_seen_at' => now()->subHours(1),
            'status' => 'active',
        ]);

        $verifiedDevice = $this->service->verifyAndHeartbeat($device->device_id, 'test_token');

        $this->assertNotNull($verifiedDevice);
        $this->assertEquals($device->id, $verifiedDevice->id);
        $this->assertTrue($verifiedDevice->last_seen_at->gt(now()->subMinute()));
    }

    /** @test */
    public function it_returns_null_for_invalid_token()
    {
        $device = UwDevice::factory()->create([
            'api_token' => 'secure_token',
            'status' => 'active',
        ]);

        $verifiedDevice = $this->service->verifyAndHeartbeat($device->device_id, 'wrong_token');

        $this->assertNull($verifiedDevice);
    }

    /** @test */
    public function it_returns_false_for_is_online_if_not_seen_recently()
    {
        $device = UwDevice::factory()->offline()->create();
        $this->assertFalse($device->is_online);

        $device->update(['last_seen_at' => now()]);
        $this->assertTrue($device->is_online);
    }

    /** @test */
    public function it_correctly_counts_anomalies()
    {
        $device = UwDevice::factory()->create();

        AnomalyLog::create([
            'iot_box_id' => $device->id,
            'device_id' => $device->device_id,
            'anomaly_type' => 'sound_anomaly',
        ]);

        AnomalyLog::create([
            'iot_box_id' => $device->id,
            'device_id' => $device->device_id,
            'anomaly_type' => 'anti_tampering',
        ]);

        $this->assertEquals(2, $device->anomaly_count);
    }
}
