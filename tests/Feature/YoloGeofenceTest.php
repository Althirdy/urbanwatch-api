<?php

namespace Tests\Feature;

use App\Http\Resources\Api\v1\CCTVResource;
use App\Models\cctvDevices;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class YoloGeofenceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that CCTV devices can be created with direct coordinates.
     */
    public function test_cctv_device_has_direct_coordinates(): void
    {
        // Create a CCTV device with direct coordinates (no location relationship)
        $cctvDevice = cctvDevices::create([
            'location_name' => 'Test Camera',
            'latitude' => 14.79,
            'longitude' => 121.04,
            'status' => 'active',
            'yolo_enabled' => true,
            'installation_date' => '01/25/2004',
            'primary_rtsp_url' => 'rtsp://192.168.1.100:554/stream1',
            'rtsp_username' => 'admin',
            'rtsp_password' => 'password',
        ]);

        // Assert device is created with correct coordinates
        $this->assertNotNull($cctvDevice->latitude);
        $this->assertNotNull($cctvDevice->longitude);
        $this->assertEquals('Test Camera', $cctvDevice->location_name);
        $this->assertEquals(14.79, $cctvDevice->latitude);
        $this->assertEquals(121.04, $cctvDevice->longitude);
    }

    /**
     * Test that CCTVResource returns location fields correctly.
     */
    public function test_cctv_resource_includes_location_fields(): void
    {
        $cctvDevice = cctvDevices::create([
            'location_name' => 'Resource Test Camera',
            'latitude' => 14.785,
            'longitude' => 121.045,
            'status' => 'active',
            'installation_date' => '2024-01-15',
            'primary_rtsp_url' => 'rtsp://192.168.1.101:554/stream1',
            'rtsp_username' => 'admin',
            'rtsp_password' => 'password',
        ]);

        $resource = new CCTVResource($cctvDevice);
        $array = $resource->toArray(request());

        $this->assertArrayHasKey('location_name', $array);
        $this->assertArrayHasKey('latitude', $array);
        $this->assertArrayHasKey('longitude', $array);
        $this->assertEquals('Resource Test Camera', $array['location_name']);
        $this->assertEquals(14.785, $array['latitude']);
        $this->assertEquals(121.045, $array['longitude']);
    }

    /**
     * Test that YOLO-enabled devices can be queried.
     */
    public function test_yolo_enabled_devices_query(): void
    {
        // Create enabled and disabled devices
        cctvDevices::create([
            'location_name' => 'Enabled Camera',
            'latitude' => 14.79,
            'longitude' => 121.04,
            'status' => 'active',
            'yolo_enabled' => true,
            'installation_date' => '2024-01-15',
            'primary_rtsp_url' => 'rtsp://192.168.1.102:554/stream1',
            'rtsp_username' => 'admin',
            'rtsp_password' => 'password',
        ]);

        cctvDevices::create([
            'location_name' => 'Disabled Camera',
            'latitude' => 14.80,
            'longitude' => 121.05,
            'status' => 'active',
            'yolo_enabled' => false,
            'installation_date' => '2024-01-15',
            'primary_rtsp_url' => 'rtsp://192.168.1.103:554/stream1',
            'rtsp_username' => 'admin',
            'rtsp_password' => 'password',
        ]);

        $enabledDevices = cctvDevices::where('yolo_enabled', true)->get();
        $this->assertCount(1, $enabledDevices);
        $this->assertEquals('Enabled Camera', $enabledDevices->first()->location_name);
    }
}
