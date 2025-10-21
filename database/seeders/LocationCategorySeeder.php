<?php

namespace Database\Seeders;

use App\Models\LocationCategory;
use Illuminate\Database\Seeder;

class LocationCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'School'],
            ['name' => 'Hospital'],
            ['name' => 'Market'],
            ['name' => 'Park'],
            ['name' => 'Government Office'],
            ['name' => 'Historic'],
            ['name' => 'Commercial'],
            ['name' => 'Educational'],
            ['name' => 'University'],
            ['name' => 'Government'],
            ['name' => 'Transportation'],
            ['name' => 'Mall'],
        ];

        foreach ($categories as $category) {
            LocationCategory::firstOrCreate(
                ['name' => $category['name']]
            );
        }
    }
}
