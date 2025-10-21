<?php

namespace Database\Seeders;

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

        $this->call(LocationCategorySeeder::class);

        $roles = [
            ['name' => 'Operator', 'description' => 'Operator role with limited access'],
            ['name' => 'Purok Leader', 'description' => 'Purok Leader role with moderate access'],
            ['name' => 'Citizen', 'description' => 'Citizen role with basic access'],
        ];

        foreach ($roles as $role) {
            Roles::firstOrCreate(['name' => $role['name']], $role);
        }

        $this->call(UserSeeder::class);
        $this->call(ReportSeeder::class);
        $this->call(PublicPostSeeder::class);
    }
}
