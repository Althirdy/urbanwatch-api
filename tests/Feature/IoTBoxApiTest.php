<?php

namespace Tests\Feature;

use App\Models\UwDevice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IoTBoxApiTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_verify_a_device_via_api()
    {
        $device = UwDevice::factory()->create([
            'api_token' => 'test_api_token',
            'status' => 'active',
        ]);

        $response = $this->withHeaders([
            'X-Device-Token' => 'test_api_token',
        ])->postJson('/api/v1/iot-box/verify', [
            'device_id' => $device->device_id,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'verified' => true,
                    'device_name' => $device->device_name,
                    'status' => 'active',
                ],
            ]);
        
        $device->refresh();
        $this->assertNotNull($device->last_seen_at);
    }

    /** @test */
    public function it_rejects_verification_with_missing_token()
    {
        $device = UwDevice::factory()->create();

        $response = $this->postJson('/api/v1/iot-box/verify', [
            'device_id' => $device->device_id,
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function it_can_store_anomaly_log_with_valid_token()
    {
        $device = UwDevice::factory()->create([
            'api_token' => 'valid_token',
            'status' => 'active',
        ]);

        $response = $this->withHeaders([
            'X-Device-Token' => 'valid_token',
        ])->postJson('/api/v1/iot-box/anomaly', [
            'device_id' => $device->device_id,
            'anomaly_type' => 'sound_anomaly',
            'details' => ['decibel' => 90],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('anomaly_logs', [
            'iot_box_id' => $device->id,
            'anomaly_type' => 'sound_anomaly',
        ]);

        $this->assertEquals(1, $device->fresh()->anomaly_count);
    }

    /** @test */
    public function it_rejects_anomaly_log_from_inactive_device()
    {
        $device = UwDevice::factory()->inactive()->create([
            'api_token' => 'some_token',
        ]);

        $response = $this->withHeaders([
            'X-Device-Token' => 'some_token',
        ])->postJson('/api/v1/iot-box/anomaly', [
            'device_id' => $device->device_id,
            'anomaly_type' => 'sound_anomaly',
        ]);

        $response->assertStatus(403);
    }
}
