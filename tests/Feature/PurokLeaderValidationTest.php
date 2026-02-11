<?php

namespace Tests\Feature;

use App\Models\CitizenDetails;
use App\Models\OfficialsDetails;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PurokLeaderValidationTest extends TestCase
{
    use RefreshDatabase;

    private Roles $operatorRole;

    private Roles $purokLeaderRole;

    private Roles $citizenRole;

    protected function setUp(): void
    {
        parent::setUp();

        $this->operatorRole = Roles::firstOrCreate(['name' => 'Operator'], ['description' => 'Operator role']);
        $this->purokLeaderRole = Roles::firstOrCreate(['name' => 'Purok Leader'], ['description' => 'Purok Leader role']);
        $this->citizenRole = Roles::firstOrCreate(['name' => 'Citizen'], ['description' => 'Citizen role']);
        Roles::firstOrCreate(['name' => 'Superadmin'], ['description' => 'Superadmin role']);
    }

    public function test_operator_cannot_create_purok_leader_without_phone_number(): void
    {
        $operator = $this->createOperator();

        $response = $this->actingAs($operator)->post('/user', $this->validPurokPayload([
            'phone_number' => '',
        ]));

        $response->assertSessionHasErrors('phone_number');
    }

    public function test_operator_cannot_create_purok_leader_with_invalid_phone_number_format(): void
    {
        $operator = $this->createOperator();

        $response = $this->actingAs($operator)->post('/user', $this->validPurokPayload([
            'phone_number' => '12345',
        ]));

        $response->assertSessionHasErrors('phone_number');
    }

    public function test_operator_cannot_create_purok_leader_with_duplicate_phone_number_in_citizen_details(): void
    {
        $operator = $this->createOperator();
        $citizen = User::factory()->create([
            'role_id' => $this->citizenRole->id,
            'email_verified_at' => now(),
        ]);

        CitizenDetails::create([
            'user_id' => $citizen->id,
            'pcn_number' => 'PCN-TEST-1001',
            'first_name' => 'Citizen',
            'middle_name' => null,
            'last_name' => 'Sample',
            'suffix' => null,
            'date_of_birth' => '1990-01-01',
            'phone_number' => '09123456789',
            'address' => 'Sample Address',
            'barangay' => 'Barangay 176-E',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'is_verified' => true,
        ]);

        $response = $this->actingAs($operator)->post('/user', $this->validPurokPayload([
            'phone_number' => '09123456789',
        ]));

        $response->assertSessionHasErrors('phone_number');
    }

    public function test_operator_cannot_create_purok_leader_with_invalid_email(): void
    {
        $operator = $this->createOperator();

        $response = $this->actingAs($operator)->post('/user', $this->validPurokPayload([
            'email' => 'invalid-email',
        ]));

        $response->assertSessionHasErrors('email');
    }

    public function test_operator_can_update_purok_leader_with_same_phone_number(): void
    {
        $operator = $this->createOperator();
        $leader = $this->createPurokLeader('09111111111');

        $response = $this->actingAs($operator)->put("/user/{$leader->id}", [
            'first_name' => 'Updated',
            'middle_name' => '',
            'last_name' => 'Leader',
            'suffix' => '',
            'email' => $leader->email,
            'phone_number' => '09111111111',
            'role_id' => $this->purokLeaderRole->id,
            'status' => 'Active',
            'office_address' => 'HQ',
            'assigned_brgy' => 'Barangay 176-E',
            'latitude' => '',
            'longitude' => '',
            'purok_id' => '',
        ]);

        $response->assertSessionDoesntHaveErrors();
    }

    public function test_operator_cannot_update_purok_leader_to_duplicate_phone_number(): void
    {
        $operator = $this->createOperator();
        $leader = $this->createPurokLeader('09111111111');
        $this->createPurokLeader('09222222222', 'other.leader@example.com');

        $response = $this->actingAs($operator)->put("/user/{$leader->id}", [
            'first_name' => 'Updated',
            'middle_name' => '',
            'last_name' => 'Leader',
            'suffix' => '',
            'email' => $leader->email,
            'phone_number' => '09222222222',
            'role_id' => $this->purokLeaderRole->id,
            'status' => 'Active',
            'office_address' => 'HQ',
            'assigned_brgy' => 'Barangay 176-E',
            'latitude' => '',
            'longitude' => '',
            'purok_id' => '',
        ]);

        $response->assertSessionHasErrors('phone_number');
    }

    private function createOperator(): User
    {
        return User::factory()->create([
            'role_id' => $this->operatorRole->id,
            'email_verified_at' => now(),
        ]);
    }

    private function createPurokLeader(string $phone, string $email = 'leader@example.com'): User
    {
        $leader = User::factory()->create([
            'role_id' => $this->purokLeaderRole->id,
            'email' => $email,
            'password' => Hash::make('1001'),
            'email_verified_at' => now(),
        ]);

        OfficialsDetails::create([
            'user_id' => $leader->id,
            'first_name' => 'Purok',
            'middle_name' => '',
            'last_name' => 'Leader',
            'suffix' => null,
            'contact_number' => $phone,
            'office_address' => 'HQ',
            'assigned_brgy' => 'Barangay 176-E',
            'latitude' => null,
            'longitude' => null,
        ]);

        return $leader;
    }

    private function validPurokPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'New',
            'middle_name' => '',
            'last_name' => 'Leader',
            'suffix' => '',
            'email' => 'new.leader@example.com',
            'phone_number' => '09123456789',
            'role_id' => $this->purokLeaderRole->id,
            'assigned_brgy' => 'Barangay 176-E',
            'office_address' => 'HQ',
            'password' => '1234',
            'password_confirmation' => '1234',
            'latitude' => '',
            'longitude' => '',
            'purok_id' => '',
        ], $overrides);
    }
}
