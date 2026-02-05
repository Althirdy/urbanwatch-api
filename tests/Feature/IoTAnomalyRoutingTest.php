<?php

namespace Tests\Feature;

use App\Models\AnomalyLog;
use App\Models\OfficialsDetails;
use App\Models\Purok;
use App\Models\Roles;
use App\Models\User;
use App\Models\UwDevice;
use App\Services\GeographicRoutingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IoTAnomalyRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed required roles
        Roles::factory()->create(['id' => 1, 'name' => 'Citizen']);
        Roles::factory()->create(['id' => 2, 'name' => 'Purok Leader']);
    }

    /**
     * Test that IoT devices use custom_latitude and custom_longitude.
     */
    public function test_iot_device_uses_custom_coordinates(): void
    {
        $device = UwDevice::create([
            'device_id' => 'TEST-IOT-001',
            'device_name' => 'Test IoT Box',
            'custom_latitude' => 14.79,
            'custom_longitude' => 121.04,
            'custom_address' => 'Test Address',
            'status' => 'active',
            'api_token' => hash('sha256', 'test-token'),
        ]);

        $this->assertEquals(14.79, $device->custom_latitude);
        $this->assertEquals(121.04, $device->custom_longitude);

        // Verify the appended latitude/longitude attributes work
        $this->assertEquals(14.79, $device->latitude);
        $this->assertEquals(121.04, $device->longitude);
    }

    /**
     * Test that anomaly logs can be created and linked to IoT devices.
     */
    public function test_anomaly_log_creation_with_iot_device(): void
    {
        $device = UwDevice::create([
            'device_id' => 'TEST-IOT-002',
            'device_name' => 'Anomaly Test Box',
            'custom_latitude' => 14.785,
            'custom_longitude' => 121.040,
            'custom_address' => 'Test Address',
            'status' => 'active',
            'api_token' => hash('sha256', 'test-token-2'),
        ]);

        $anomalyLog = AnomalyLog::create([
            'device_id' => $device->device_id,
            'iot_box_id' => $device->id,
            'anomaly_type' => 'sound_anomaly',
            'is_confirmed' => false,
        ]);

        $this->assertNotNull($anomalyLog->id);
        $this->assertEquals($device->id, $anomalyLog->iot_box_id);
        $this->assertEquals('sound_anomaly', $anomalyLog->anomaly_type);

        // Test relationship
        $this->assertEquals($device->id, $anomalyLog->iotBox->id);
    }

    /**
     * Test that GeographicRoutingService correctly identifies a Purok from coordinates.
     */
    public function test_routing_service_finds_purok_from_coordinates(): void
    {
        // Create a purok with a known boundary
        $purok = Purok::create([
            'name' => 'IoT Test Purok',
            'color' => '#FF0000',
        ]);

        // Update boundary using raw SQL (spatial data)
        DB::statement("UPDATE puroks SET boundary = ST_GeomFromText('POLYGON((121.03 14.78, 121.05 14.78, 121.05 14.80, 121.03 14.80, 121.03 14.78))') WHERE id = ?", [$purok->id]);

        // Create a user with purok leader role
        $leaderUser = User::factory()->create([
            'role_id' => 2,
        ]);

        // Create leader details
        $leader = OfficialsDetails::create([
            'user_id' => $leaderUser->id,
            'first_name' => 'Test',
            'last_name' => 'Leader',
            'contact_number' => '09123456789',
            'purok_id' => $purok->id,
            'office_address' => 'Test Purok Office',
            'assigned_brgy' => '176',
        ]);

        // Test coordinates inside the boundary
        $routingService = app(GeographicRoutingService::class);
        $result = $routingService->findPurokLeader(14.79, 121.04); // Inside

        $this->assertNotNull($result);
        $this->assertEquals($purok->id, $result['purok']->id);
        $this->assertEquals($leader->id, $result['leader']->id);
    }

    /**
     * Test that coordinates outside any Purok return null.
     */
    public function test_routing_service_returns_null_for_outside_coordinates(): void
    {
        // Create a purok with a known boundary
        $purok = Purok::create([
            'name' => 'Isolated Purok',
            'color' => '#00FF00',
        ]);

        DB::statement("UPDATE puroks SET boundary = ST_GeomFromText('POLYGON((121.00 14.70, 121.01 14.70, 121.01 14.71, 121.00 14.71, 121.00 14.70))') WHERE id = ?", [$purok->id]);

        // Test coordinates completely outside
        $routingService = app(GeographicRoutingService::class);
        $result = $routingService->findPurokLeader(15.00, 122.00); // Far outside

        $this->assertNull($result);
    }
}
