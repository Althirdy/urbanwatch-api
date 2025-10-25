<?php

namespace Database\Seeders;

use App\Models\cctvDevices;
use App\Models\Locations;
use Illuminate\Database\Seeder;

class CctvDeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, ensure we have locations to link to
        // If no locations exist, create some sample locations
        if (Locations::count() === 0) {
            Locations::insert([
                [
                    'location_category' => 1, // Government
                    'location_name' => 'Barangay 176A Hall',
                    'landmark' => 'Main Entrance',
                    'barangay' => 'Barangay 176A',
                    'latitude' => 14.7730,
                    'longitude' => 121.0540,
                    'description' => 'Main barangay hall building',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'location_category' => 2, // Commercial
                    'location_name' => 'Metroplaza Phase 5',
                    'landmark' => 'Shopping Center',
                    'barangay' => 'Barangay 176A',
                    'latitude' => 14.7751,
                    'longitude' => 121.0448,
                    'description' => 'Commercial shopping area',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'location_category' => 6, // Transportation
                    'location_name' => 'Main Road Junction',
                    'landmark' => 'Traffic Light',
                    'barangay' => 'Barangay 176A',
                    'latitude' => 14.7740,
                    'longitude' => 121.0530,
                    'description' => 'Major road intersection',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // Get location IDs to use in CCTV devices
        $locations = Locations::all();

        // Sample CCTV devices data
        $cctvDevices = [
            [
                'location_id' => $locations->first()->id,
                'device_name' => 'CCTV-BH-001',
                'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.101:554/stream1',
                'backup_rtsp_url' => 'rtsp://admin:admin123@192.168.1.101:554/stream2',
                'status' => 'Active',
                'brand' => 'Hikvision',
                'model' => 'DS-2CD2043G2-I',
                'resolution' => '1920x1080',
                'fps' => 30,
                'installation_date' => '2024-01-15',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'location_id' => $locations->skip(1)->first()->id ?? $locations->first()->id,
                'device_name' => 'CCTV-MP-002',
                'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.102:554/stream1',
                'backup_rtsp_url' => null,
                'status' => 'Active',
                'brand' => 'Dahua',
                'model' => 'IPC-HFW5831E-Z5E',
                'resolution' => '3840x2160',
                'fps' => 25,
                'installation_date' => '2024-02-20',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'location_id' => $locations->skip(2)->first()->id ?? $locations->first()->id,
                'device_name' => 'CCTV-MR-003',
                'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.103:554/stream1',
                'backup_rtsp_url' => 'rtsp://admin:admin123@192.168.1.103:554/stream2',
                'status' => 'Active',
                'brand' => 'Axis',
                'model' => 'P3245-LVE',
                'resolution' => '1920x1080',
                'fps' => 30,
                'installation_date' => '2024-03-10',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'location_id' => $locations->first()->id,
                'device_name' => 'CCTV-BH-004',
                'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.104:554/stream1',
                'backup_rtsp_url' => 'rtsp://admin:admin123@192.168.1.104:554/stream2',
                'status' => 'Maintenance',
                'brand' => 'Hikvision',
                'model' => 'DS-2CD2386G2-IU',
                'resolution' => '3840x2160',
                'fps' => 20,
                'installation_date' => '2024-01-25',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'location_id' => $locations->skip(1)->first()->id ?? $locations->first()->id,
                'device_name' => 'CCTV-MP-005',
                'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.105:554/stream1',
                'backup_rtsp_url' => null,
                'status' => 'Inactive',
                'brand' => 'Uniview',
                'model' => 'IPC3615SB-ADF40KM-I0',
                'resolution' => '2560x1440',
                'fps' => 30,
                'installation_date' => '2023-12-05',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'location_id' => $locations->skip(2)->first()->id ?? $locations->first()->id,
                'device_name' => 'CCTV-MR-006',
                'primary_rtsp_url' => 'rtsp://admin:admin123@192.168.1.106:554/stream1',
                'backup_rtsp_url' => 'rtsp://admin:admin123@192.168.1.106:554/stream2',
                'status' => 'Active',
                'brand' => 'Dahua',
                'model' => 'DH-IPC-HFW2831S-S-S2',
                'resolution' => '3840x2160',
                'fps' => 25,
                'installation_date' => '2024-04-18',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert CCTV devices
        cctvDevices::insert($cctvDevices);

        $this->command->info('CCTV devices seeded successfully!');
    }
}

