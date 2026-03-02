<?php

namespace Tests\Feature\Operator;

use App\Models\Accident;
use App\Models\cctvDevices;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function createOperator(): User
    {
        $operatorRole = Roles::firstOrCreate(
            ['name' => 'Operator'],
            ['description' => 'Operator role']
        );

        return User::factory()->create([
            'role_id' => $operatorRole->id,
            'email_verified_at' => now(),
        ]);
    }

    protected function createDevice(): cctvDevices
    {
        return cctvDevices::create([
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

    public function test_acknowledged_filter_handles_mixed_case_status_values(): void
    {
        $operator = $this->createOperator();
        $device = $this->createDevice();

        $resolvedUpper = Accident::create([
            'cctv_device_id' => $device->id,
            'accident_type' => 'Fire',
            'status' => 'Resolved',
            'severity' => 'Low',
            'title' => 'Resolved Upper',
            'description' => 'Resolved uppercase',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'occurred_at' => now()->subMinutes(5),
        ]);

        $resolvedLower = Accident::create([
            'cctv_device_id' => $device->id,
            'accident_type' => 'Fire',
            'status' => 'resolved',
            'severity' => 'Low',
            'title' => 'Resolved Lower',
            'description' => 'Resolved lowercase',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'occurred_at' => now()->subMinutes(4),
        ]);

        $pendingUpper = Accident::create([
            'cctv_device_id' => $device->id,
            'accident_type' => 'Fire',
            'status' => 'Pending',
            'severity' => 'Low',
            'title' => 'Pending Upper',
            'description' => 'Pending uppercase',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'occurred_at' => now()->subMinutes(3),
        ]);

        $pendingLower = Accident::create([
            'cctv_device_id' => $device->id,
            'accident_type' => 'Fire',
            'status' => 'pending',
            'severity' => 'Low',
            'title' => 'Pending Lower',
            'description' => 'Pending lowercase',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'occurred_at' => now()->subMinutes(2),
        ]);

        $acknowledgedResponse = $this->actingAs($operator)
            ->get(route('reports', ['acknowledged' => 'true']));

        $acknowledgedResponse->assertOk();
        $acknowledgedPage = $acknowledgedResponse->viewData('page');
        $acknowledgedIds = collect(data_get($acknowledgedPage, 'props.reports.data', []))
            ->pluck('id')
            ->all();

        $this->assertContains($resolvedUpper->id, $acknowledgedIds);
        $this->assertContains($resolvedLower->id, $acknowledgedIds);
        $this->assertNotContains($pendingUpper->id, $acknowledgedIds);
        $this->assertNotContains($pendingLower->id, $acknowledgedIds);

        $unacknowledgedResponse = $this->actingAs($operator)
            ->get(route('reports', ['acknowledged' => 'false']));

        $unacknowledgedResponse->assertOk();
        $unacknowledgedPage = $unacknowledgedResponse->viewData('page');
        $unacknowledgedIds = collect(data_get($unacknowledgedPage, 'props.reports.data', []))
            ->pluck('id')
            ->all();

        $this->assertContains($pendingUpper->id, $unacknowledgedIds);
        $this->assertContains($pendingLower->id, $unacknowledgedIds);
        $this->assertNotContains($resolvedUpper->id, $unacknowledgedIds);
        $this->assertNotContains($resolvedLower->id, $unacknowledgedIds);
    }
}
