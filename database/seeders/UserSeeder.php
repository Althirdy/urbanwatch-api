<?php

namespace Database\Seeders;

use App\Models\CitizenDetails;
use App\Models\OfficialsDetails;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Operator User
        User::firstOrCreate(
            ['email' => 'nico@gmail.com'],
            [
                'role_id' => 1,
                'name' => 'Nico Saydallus',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        OfficialsDetails::firstOrCreate(
            ['user_id' => User::where('email', 'nico@gmail.com')->first()->id],
            [
                'contact_number' => '+63 912-345-6789',
                'first_name' => 'Nico',
                'middle_name' => 'M.',
                'last_name' => 'Saydallus',
                'suffix' => null,
                'office_address' => 'ph1 Barangay 176A Near Sto Nino Parish',
                'assigned_brgy' => 'Barangay 176A',
                'latitude' => '14.5995',
                'longitude' => '120.9842',
                'status' => 'active',
            ]
        );

        // Create Purok Leader User
        User::firstOrCreate(
            ['email' => 'enrico@gmail.com'],
            [
                'role_id' => 2,
                'name' => 'Enrico Guina',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        OfficialsDetails::firstOrCreate(
            ['user_id' => User::where('email', 'enrico@gmail.com')->first()->id],
            [
                'contact_number' => '+63 987-654-3210',
                'first_name' => 'Enrico',
                'middle_name' => 'L.',
                'last_name' => 'Guina',
                'suffix' => null,
                'office_address' => 'Ph 1 Pkg 1',
                'assigned_brgy' => 'Barangay 176A',
                'latitude' => '14.6095',
                'longitude' => '120.9742',
                'status' => 'active',
            ]
        );

        // Create Resident User
        User::firstOrCreate(
            ['email' => 'sangertbr@gmail.com'],
            [
                'role_id' => 3,
                'name' => 'Sanger Briones',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        CitizenDetails::firstOrCreate(
            ['user_id' => User::where('email', 'sangertbr@gmail.com')->first()->id],
            [
                'first_name' => 'Sanger',
                'middle_name' => 'T.',
                'last_name' => 'Briones',
                'suffix' => null,
                'date_of_birth' => '1990-01-01',
                'phone_number' => '+63 912-345-6789',
                'address' => 'Ph1 Pkg4, Barangay 176A',
                'barangay' =>  'Barangay 176A',
                'city' => 'Caloocan City',
                'province' => 'Metro Manila',
                'postal_code' => '1400',
                'is_verified' => true,
                'status' => 'active',
            ]
        );
    }
}
