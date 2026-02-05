<?php

namespace Database\Seeders;

use App\Models\UwDevice;
use Illuminate\Database\Seeder;

class UwDeviceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Sample UW devices data with custom addresses
        $uwDevices = [
            [
                'device_name' => 'UW-SENSOR-001',
                'status' => 'active',
                'custom_address' => 'Barangay Hall - Purok 1, Barangay 176-E',
                'custom_latitude' => 14.7750,
                'custom_longitude' => 121.0510,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-002',
                'status' => 'active',
                'custom_address' => 'Main Plaza - Purok 3, Barangay 176-E',
                'custom_latitude' => 14.7755,
                'custom_longitude' => 121.0515,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-003',
                'status' => 'active',
                'custom_address' => 'Market Road - Purok 5, Barangay 176-E',
                'custom_latitude' => 14.7760,
                'custom_longitude' => 121.0520,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-004',
                'status' => 'maintenance',
                'custom_address' => 'School Area - Purok 6, Barangay 176-E',
                'custom_latitude' => 14.7748,
                'custom_longitude' => 121.0512,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'device_name' => 'UW-SENSOR-005',
                'status' => 'inactive',
                'custom_address' => 'Riverside - Purok 7, Barangay 176-E',
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
