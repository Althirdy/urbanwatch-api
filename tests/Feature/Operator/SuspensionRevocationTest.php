<?php

namespace Tests\Feature\Operator;

use App\Models\CitizenDetails;
use App\Models\Roles;
use App\Models\User;
use App\Models\UserSuspension;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuspensionRevocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_revoking_active_suspension_resets_strikes_to_zero(): void
    {
        $operatorRole = Roles::factory()->create([
            'id' => 1,
            'name' => 'Operator',
        ]);
        $citizenRole = Roles::factory()->create([
            'id' => 3,
            'name' => 'Citizen',
        ]);

        $operator = User::factory()->create([
            'role_id' => $operatorRole->id,
        ]);
        $citizen = User::factory()->create([
            'role_id' => $citizenRole->id,
            'false_alarm_strikes' => 5,
        ]);

        CitizenDetails::create([
            'user_id' => $citizen->id,
            'pcn_number' => 'PCN-'.$citizen->id,
            'first_name' => 'Test',
            'middle_name' => null,
            'last_name' => 'Citizen',
            'suffix' => null,
            'date_of_birth' => '1990-01-01',
            'phone_number' => '09123456789',
            'address' => 'Test Address',
            'barangay' => '176',
            'city' => 'Caloocan',
            'province' => 'Metro Manila',
            'postal_code' => '1400',
            'status' => 'suspended',
        ]);

        $suspension = UserSuspension::create([
            'user_id' => $citizen->id,
            'punishment_type' => 'warning_2',
            'duration_days' => 7,
            'suspended_at' => now()->subDay(),
            'expires_at' => now()->addDays(6),
            'status' => 'active',
            'reason' => 'Test suspension',
            'suspended_by' => $operator->id,
        ]);

        $response = $this->actingAs($operator)->patch(route('user.revoke-suspension', $citizen->id));

        $response->assertRedirect(route('users'));
        $response->assertSessionHas('success', 'Suspension revoked successfully. User has been restored and strikes reset to 0.');

        $this->assertDatabaseHas('user_suspensions', [
            'id' => $suspension->id,
            'status' => 'revoked',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $citizen->id,
            'false_alarm_strikes' => 0,
        ]);
        $this->assertDatabaseHas('citizen_details', [
            'user_id' => $citizen->id,
            'status' => 'active',
        ]);
    }
}
