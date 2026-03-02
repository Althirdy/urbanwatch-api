<?php

namespace Tests\Unit\Services;

use App\Models\Accident;
use App\Models\AccidentResponderNotification;
use App\Models\cctvDevices;
use App\Models\Contact;
use App\Services\AccidentResponderDispatchService;
use App\Services\TextBeeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AccidentResponderDispatchServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function createAccident(): Accident
    {
        $device = cctvDevices::create([
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

        return Accident::create([
            'cctv_device_id' => $device->id,
            'accident_type' => 'Fire',
            'status' => 'Pending',
            'severity' => 'Low',
            'title' => 'Fire Incident',
            'description' => 'Detected fire incident',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'occurred_at' => now(),
        ]);
    }

    public function test_it_dispatches_globally_to_active_contacts_matching_category(): void
    {
        config(['yolo.responder_mapping' => ['Fire' => ['Fire']]]);

        $accident = $this->createAccident();

        $matchingContact = Contact::withoutEvents(function () {
            return Contact::create([
                'branch_unit_name' => 'BFP',
                'contact_person' => 'Primary Fire Responder',
                'responder_type' => 'Fire',
                'primary_mobile' => '09171234567',
                'backup_mobile' => null,
                'active' => true,
            ]);
        });

        Contact::withoutEvents(function () {
            Contact::create([
                'branch_unit_name' => 'Inactive Fire Unit',
                'contact_person' => 'Inactive Contact',
                'responder_type' => 'Fire',
                'primary_mobile' => '09170000001',
                'backup_mobile' => null,
                'active' => false,
            ]);
        });

        Contact::withoutEvents(function () {
            Contact::create([
                'branch_unit_name' => 'Traffic Unit',
                'contact_person' => 'Traffic Contact',
                'responder_type' => 'Traffic',
                'primary_mobile' => '09170000002',
                'backup_mobile' => null,
                'active' => true,
            ]);
        });

        $textBeeService = Mockery::mock(TextBeeService::class);
        $textBeeService->shouldReceive('sendSms')
            ->once()
            ->with(['09171234567'], Mockery::type('string'))
            ->andReturn(['ok' => true]);

        $service = new AccidentResponderDispatchService($textBeeService);
        $service->dispatchForAccidentClass($accident, 'Fire');

        $this->assertDatabaseHas('accident_responder_notifications', [
            'accident_id' => $accident->id,
            'incident_class' => 'Fire',
            'contact_id' => $matchingContact->id,
            'send_target' => 'primary',
            'status' => 'sent',
        ]);
    }

    public function test_it_records_skipped_no_contacts_when_no_global_match_exists(): void
    {
        config(['yolo.responder_mapping' => ['Fire' => ['Fire']]]);

        $accident = $this->createAccident();

        $textBeeService = Mockery::mock(TextBeeService::class);
        $textBeeService->shouldReceive('sendSms')->never();

        $service = new AccidentResponderDispatchService($textBeeService);
        $service->dispatchForAccidentClass($accident, 'Fire');

        $this->assertDatabaseHas('accident_responder_notifications', [
            'accident_id' => $accident->id,
            'incident_class' => 'Fire',
            'status' => 'skipped_no_contacts',
        ]);

        $this->assertSame(1, AccidentResponderNotification::count());
    }
}
