<?php

namespace Database\Seeders;

use App\Models\CitizenDetails;
use App\Models\OfficialsDetails;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $operatorRoleId = Roles::query()->where('name', 'Operator')->value('id');
        $purokLeaderRoleId = Roles::query()->where('name', 'Purok Leader')->value('id');
        $citizenRoleId = Roles::query()->where('name', 'Citizen')->value('id');

        if (! $operatorRoleId || ! $purokLeaderRoleId || ! $citizenRoleId) {
            return;
        }

        // Create Operator User
        User::firstOrCreate(
            ['email' => 'jericotagorda@gmail.com'],
            [
                'role_id' => $operatorRoleId,
                'name' => 'Jerico Tagorda',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        OfficialsDetails::firstOrCreate(
            ['user_id' => User::where('email', 'jericotagorda@gmail.com')->first()->id],
            [
                'contact_number' => '+63 912-345-6789',
                'first_name' => 'Jerico',
                'middle_name' => '',
                'last_name' => 'Tagorda',
                'suffix' => null,
                'office_address' => 'Phase 9 Package 7A, Brgy, 176 E Bagong Silang, Caloocan',
                'assigned_brgy' => 'Barangay 176-E',
                'latitude' => '14.779280528659992',
                'longitude' => ' 121.0363472121374',
                'status' => 'active',
            ]
        );

        // Create Purok Leader User
        User::firstOrCreate(
            ['email' => 'nestorparungao@gmail.com'],
            [
                'role_id' => $purokLeaderRoleId,
                'name' => 'Nestor Parungao',
                'password' => Hash::make('1001'),
                'email_verified_at' => now(),
            ]
        );
        OfficialsDetails::firstOrCreate(
            ['user_id' => User::where('email', 'nestorparungao@gmail.com')->first()->id],
            [
                'contact_number' => '+63 945-899-6127',
                'first_name' => 'Nestor',
                'middle_name' => '',
                'last_name' => 'Parungao',
                'suffix' => null,
                'office_address' => 'Phase 7A Lakan',
                'assigned_brgy' => 'Barangay 176-E',
                'latitude' => '14.77967214227513',
                'longitude' => ' 121.03578998323289',
                'status' => 'active',
            ]
        );

        // Create Resident User
        User::firstOrCreate(
            ['email' => 'sangertbr@gmail.com'],
            [
                'role_id' => $citizenRoleId,
                'name' => 'Sanger Briones',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        CitizenDetails::firstOrCreate(
            ['user_id' => User::where('email', 'sangertbr@gmail.com')->first()->id],
            [
                'pcn_number' => 'PCN-2024-0001',
                'first_name' => 'Sanger',
                'middle_name' => 'T.',
                'last_name' => 'Briones',
                'suffix' => null,
                'date_of_birth' => '1990-01-01',
                'phone_number' => '+63 912-345-6789',
                'address' => 'Ph1 Pkg4, Barangay 176-E',
                'barangay' => 'Barangay 176-E',
                'city' => 'Caloocan City',
                'province' => 'Metro Manila',
                'postal_code' => '1400',
                'is_verified' => true,
                'status' => 'active',
            ]
        );
    }
}
