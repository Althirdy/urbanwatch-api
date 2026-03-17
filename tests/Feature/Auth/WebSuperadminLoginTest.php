<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class WebSuperadminLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        DB::table('roles')->insert([
            'id' => 4,
            'name' => 'Superadmin',
            'description' => 'Global system management role',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_superadmin_login_accepts_trimmed_and_case_insensitive_email(): void
    {
        $superadmin = User::create([
            'name' => 'UrbanWatch Superadmin',
            'email' => 'superadmin@urbanwatch.local',
            'password' => 'Password123!',
            'role_id' => 4,
            'email_verified_at' => now(),
        ]);

        $response = $this->post('/login', [
            'email' => '  SUPERADMIN@UrbanWatch.Local  ',
            'password' => 'Password123!',
        ]);

        $response->assertRedirect('/users');
        $this->assertAuthenticatedAs($superadmin);
    }

    public function test_superadmin_login_returns_clear_error_when_credentials_are_invalid(): void
    {
        $response = $this->from('/login')->post('/login', [
            'email' => 'superadmin@urbanwatch.local',
            'password' => 'wrong-password',
        ]);

        $response->assertRedirect('/login');
        $response->assertSessionHasErrors([
            'email' => 'Superadmin login failed. Verify credentials and ensure the superadmin account is provisioned in this environment.',
        ]);
        $this->assertGuest();
    }
}
