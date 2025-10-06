<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateUWDeviceStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Update any UW devices that have null status to 'active'
        DB::table('uw_devices')
            ->whereNull('status')
            ->update(['status' => 'active']);
            
        // If there are devices with boolean-like status values, fix them
        DB::table('uw_devices')
            ->where('status', '1')
            ->orWhere('status', 'true')
            ->update(['status' => 'active']);
            
        DB::table('uw_devices')
            ->where('status', '0')
            ->orWhere('status', 'false')
            ->update(['status' => 'inactive']);
    }
}