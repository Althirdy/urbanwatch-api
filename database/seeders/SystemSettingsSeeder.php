<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SystemSetting::updateOrCreate(
            ['key' => 'geofencing_enabled'],
            [
                'value' => 'true', // Default to ON
                'description' => 'Toggle to restrict concern submissions within Barangay 176 E boundary.',
            ]
        );

        SystemSetting::updateOrCreate(
            ['key' => 'restrict_registration_to_brgy_176'],
            [
                'value' => 'false', // Default to OFF
                'description' => 'Toggle to restrict user registration to Barangay 176 residents only (postal codes starting with 9).',
            ]
        );
    }
}
