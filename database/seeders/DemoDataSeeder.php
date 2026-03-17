<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Seed optional demo-heavy data sets.
     */
    public function run(): void
    {
        $this->call([
            CctvDeviceSeeder::class,
            ReportSeeder::class,
            PublicPostSeeder::class,
            // UwDeviceSeeder::class,
        ]);
    }
}
