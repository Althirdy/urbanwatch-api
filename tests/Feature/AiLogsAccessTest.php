<?php

namespace Tests\Feature;

use App\Models\Accident;
use App\Models\cctvDevices;
use App\Models\Citizen\Concern;
use App\Models\FalseAlarm;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiLogsAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Roles::firstOrCreate(['name' => 'Operator'], ['description' => 'Operator role']);
        Roles::firstOrCreate(['name' => 'Purok Leader'], ['description' => 'Purok leader role']);
        Roles::firstOrCreate(['name' => 'Citizen'], ['description' => 'Citizen role']);
        Roles::firstOrCreate(['name' => 'Superadmin'], ['description' => 'Superadmin role']);
    }

    public function test_superadmin_can_access_ai_logs_page(): void
    {
        $role = Roles::where('name', 'Superadmin')->firstOrFail();
        $superadmin = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($superadmin)->get('/ai-logs');

        $response->assertOk();
    }

    public function test_operator_is_forbidden_from_ai_logs_page(): void
    {
        $role = Roles::where('name', 'Operator')->firstOrFail();
        $operator = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($operator)->get('/ai-logs');

        $response->assertForbidden();
    }

    public function test_operator_reports_false_alarm_view_no_longer_shows_false_alarm_logs(): void
    {
        $role = Roles::where('name', 'Operator')->firstOrFail();
        $operator = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $device = cctvDevices::create([
            'location_name' => 'Main Road Camera',
            'primary_rtsp_url' => 'rtsp://example.test/live',
            'status' => 'active',
            'installation_date' => now()->toDateString(),
        ]);

        FalseAlarm::create([
            'cctv_device_id' => $device->id,
            'attempted_accident_type' => 'Accident',
            'gemini_reasoning' => 'SHOULD_NOT_APPEAR_FALSE_ALARM_ENTRY',
            'confidence_score' => 0.98,
            'detected_objects' => ['car'],
            'gemini_metadata' => ['source' => 'test'],
            'detected_at' => now(),
        ]);

        Accident::create([
            'title' => 'VALID_INCIDENT_ENTRY',
            'description' => 'Accident still visible in incident monitoring.',
            'latitude' => 14.7565,
            'longitude' => 121.0453,
            'occurred_at' => now(),
            'accident_type' => 'Accident',
            'status' => 'Pending',
            'severity' => 'Low',
            'cctv_device_id' => $device->id,
        ]);

        $response = $this->actingAs($operator)->get('/reports?view=false_alarms');

        $response->assertOk();
        $response->assertSee('VALID_INCIDENT_ENTRY');
        $response->assertDontSee('SHOULD_NOT_APPEAR_FALSE_ALARM_ENTRY');
    }

    public function test_superadmin_can_view_concern_false_alarm_logs_tab(): void
    {
        $superadminRole = Roles::where('name', 'Superadmin')->firstOrFail();
        $citizenRole = Roles::where('name', 'Citizen')->firstOrFail();

        $superadmin = User::factory()->create([
            'role_id' => $superadminRole->id,
            'email_verified_at' => now(),
        ]);

        $citizen = User::factory()->create([
            'role_id' => $citizenRole->id,
            'email_verified_at' => now(),
        ]);

        Concern::create([
            'citizen_id' => $citizen->id,
            'tracking_code' => 'CN-TEST-LOG-001',
            'type' => 'manual',
            'title' => 'Test concern false alarm',
            'description' => 'This concern should appear in superadmin false alarm logs.',
            'category' => 'other',
            'severity' => 'low',
            'status' => 'rejected',
            'is_valid' => false,
            'rejection_reason' => 'Detected as spam content.',
            'ai_analysis_raw' => ['is_valid' => false, 'reasoning' => 'Spam-like statement'],
        ]);

        $response = $this->actingAs($superadmin)->get('/ai-logs?tab=concerns');

        $response->assertOk();
        $response->assertSee('CN-TEST-LOG-001');
    }
}
