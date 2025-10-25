<?php

namespace Database\Seeders;

use App\Models\UwDevice;
use App\Models\Locations;
use App\Models\cctvDevices;
use Illuminate\Database\Seeder;

class UwDeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some locations and CCTV devices to link to
        $locations = Locations::take(3)->get();
        $cctvDevices = cctvDevices::take(3)->get();

        if ($locations->isEmpty()) {
            $this->command->warn('No locations found. Please seed locations first.');
            return;
        }

        // Sample UW devices data
        $uwDevices = [
            [
                'device_name' => 'UW-SENSOR-001',
                'location_id' => $locations->first()->id ?? null,
                'cctv_id' => $cctvDevices->first()->id ?? null,
                'status' => 'active',
                'custom_address' => null,
                'custom_latitude' => null,
                'custom_longitude' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-002',
                'location_id' => $locations->skip(1)->first()->id ?? null,
                'cctv_id' => $cctvDevices->skip(1)->first()->id ?? null,
                'status' => 'active',
                'custom_address' => null,
                'custom_latitude' => null,
                'custom_longitude' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-003',
                'location_id' => null,
                'cctv_id' => null,
                'status' => 'active',
                'custom_address' => 'Custom Location - Purok 5, Barangay 176A',
                'custom_latitude' => 14.7760,
                'custom_longitude' => 121.0520,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-004',
                'location_id' => $locations->skip(2)->first()->id ?? $locations->first()->id,
                'cctv_id' => $cctvDevices->skip(2)->first()->id ?? null,
                'status' => 'maintenance',
                'custom_address' => null,
                'custom_latitude' => null,
                'custom_longitude' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-005',
                'location_id' => null,
                'cctv_id' => null,
                'status' => 'inactive',
                'custom_address' => 'Custom Location - Purok 7, Barangay 176A',
                'custom_latitude' => 14.7745,
                'custom_longitude' => 121.0515,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert UW devices
        UwDevice::insert($uwDevices);

        $this->command->info('UW devices seeded successfully!');
    }
}
