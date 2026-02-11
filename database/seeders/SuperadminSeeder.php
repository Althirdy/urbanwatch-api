<?php

namespace Database\Seeders;

use App\Models\Roles;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperadminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superadminRole = Roles::where('name', 'Superadmin')->first();
        if (! $superadminRole) {
            return;
        }

        $email = env('SUPERADMIN_EMAIL', 'superadmin@urbanwatch.local');
        $password = env('SUPERADMIN_PASSWORD', 'ChangeMe123!');

        User::updateOrCreate(
            ['email' => $email],
            [
                'role_id' => $superadminRole->id,
                'name' => 'UrbanWatch Superadmin',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );
    }
}
