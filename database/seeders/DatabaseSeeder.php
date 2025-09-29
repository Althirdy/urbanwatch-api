<?php

namespace Database\Seeders;

use App\Models\LocationCategory;
use App\Models\Roles;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        LocationCategory::insert([
            [
                'name' => 'Historic',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Commercial',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Educational',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'University',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Government',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Transportation',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Mall',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $roles = [
            ['name' => 'Operator', 'description' => 'Operator role with limited access'],
            ['name' => 'Purok Leader', 'description' => 'Purok Leader role with moderate access'],
            ['name' => 'Citizen', 'description' => 'Citizen role with basic access'],
        ];

        foreach ($roles as $role) {
            Roles::firstOrCreate(['name' => $role['name']], $role);
        }

        $this->call(UserSeeder::class);
    }
}
