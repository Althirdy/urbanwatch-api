<?php

namespace Tests\Feature;

use App\Models\Roles;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperadminAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Roles::firstOrCreate(['name' => 'Operator'], ['description' => 'Operator role']);
        Roles::firstOrCreate(['name' => 'Purok Leader'], ['description' => 'Purok leader role']);
        Roles::firstOrCreate(['name' => 'Citizen'], ['description' => 'Citizen role']);
        Roles::firstOrCreate(['name' => 'Superadmin'], ['description' => 'Superadmin role']);
    }

    public function test_superadmin_can_access_system_settings_page(): void
    {
        $role = Roles::where('name', 'Superadmin')->firstOrFail();
        $superadmin = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($superadmin)->get('/system-settings');

        $response->assertOk();
    }

    public function test_operator_is_forbidden_from_system_settings_page(): void
    {
        $role = Roles::where('name', 'Operator')->firstOrFail();
        $operator = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($operator)->get('/system-settings');

        $response->assertForbidden();
    }

    public function test_operator_can_access_users_page(): void
    {
        $role = Roles::where('name', 'Operator')->firstOrFail();
        $operator = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($operator)->get('/users');

        $response->assertOk();
    }

    public function test_superadmin_is_forbidden_from_operator_dashboard(): void
    {
        $role = Roles::where('name', 'Superadmin')->firstOrFail();
        $superadmin = User::factory()->create([
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($superadmin)->get('/dashboard');

        $response->assertForbidden();
    }

    public function test_superadmin_cannot_suspend_citizen(): void
    {
        $superadminRole = Roles::where('name', 'Superadmin')->firstOrFail();
        $citizenRole = Roles::where('name', 'Citizen')->firstOrFail();

        $superadmin = User::factory()->create([
            'role_id' => $superadminRole->id,
            'email_verified_at' => now(),
        ]);

        $citizen = User::factory()->create([
            'role_id' => $citizenRole->id,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($superadmin)->post("/user/{$citizen->id}/suspend", [
            'punishment_type' => 'warning_1',
        ]);

        $response->assertForbidden();
    }
}
