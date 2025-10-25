<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ContactSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $contacts = [
            [
                'branch_unit_name' => 'BEST',
                'contact_person' => 'Juan Dela Cruz',
                'responder_type' => 'Fire',
                'location' => 'Pkg. 1A Bicolandia',
                'primary_mobile' => '09171234567',
                'backup_mobile' => '09181234567',
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BCCM',
                'contact_person' => 'Maria Santos',
                'responder_type' => 'Crime',
                'location' => 'Pkg. 1B Powerline',
                'primary_mobile' => '09171234568',
                'backup_mobile' => '09181234568',
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BCPC',
                'contact_person' => 'Pedro Reyes',
                'responder_type' => 'Crime',
                'location' => 'Pkg. 2 Sitog',
                'primary_mobile' => '09171234569',
                'backup_mobile' => null,
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BDRRM',
                'contact_person' => 'Ana Garcia',
                'responder_type' => 'Emergency',
                'location' => 'Pkg. 3 Kaunlaran',
                'primary_mobile' => '09171234570',
                'backup_mobile' => '09181234570',
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BHERT',
                'contact_person' => 'Roberto Cruz',
                'responder_type' => 'Emergency',
                'location' => 'Pkg. 3 Marilag',
                'primary_mobile' => '09171234571',
                'backup_mobile' => '09181234571',
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BHW',
                'contact_person' => 'Carmen Lopez',
                'responder_type' => 'Barangay',
                'location' => 'Pkg. 4A Atlantika',
                'primary_mobile' => '09171234572',
                'backup_mobile' => null,
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BPSO',
                'contact_person' => 'Jose Mendoza',
                'responder_type' => 'Crime',
                'location' => 'Pkg. 5 San Roque',
                'primary_mobile' => '09171234573',
                'backup_mobile' => '09181234573',
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BTMO',
                'contact_person' => 'Linda Ramos',
                'responder_type' => 'Traffic',
                'location' => 'Pkg. 6 Bayanihan',
                'primary_mobile' => '09171234574',
                'backup_mobile' => '09181234574',
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'VAWC',
                'contact_person' => 'Teresa Martinez',
                'responder_type' => 'Others',
                'location' => 'Pkg. 7A Lakan',
                'primary_mobile' => '09171234575',
                'backup_mobile' => null,
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'branch_unit_name' => 'BEST',
                'contact_person' => 'Ricardo Flores',
                'responder_type' => 'Fire',
                'location' => 'Pkg. 7B PhilRad',
                'primary_mobile' => '09171234576',
                'backup_mobile' => '09181234576',
                'latitude' => 14.7647,
                'longitude' => 121.0533,
                'active' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('contacts')->insert($contacts);
    }
}
