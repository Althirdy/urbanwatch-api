<?php

namespace Tests\Feature\Auth;

use App\Models\CitizenDetails;
use App\Models\Roles;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure citizen role exists
        Roles::firstOrCreate(['name' => 'citizen']);

        // Fake the queue to prevent actual SMS sending
        Queue::fake();
    }

    /** @test */
    public function it_returns_404_when_phone_number_not_found(): void
    {
        $response = $this->postJson('/api/v1/auth/password/request-otp', [
            'phone' => '09123456789',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Phone number not registered.',
            ]);
    }

    /** @test */
    public function it_sends_otp_for_registered_phone_number(): void
    {
        $role = Roles::where('name', 'citizen')->first();
        $user = User::factory()->create(['role_id' => $role->id]);
        CitizenDetails::factory()->create([
            'user_id' => $user->id,
            'phone_number' => '09123456789',
        ]);

        $response = $this->postJson('/api/v1/auth/password/request-otp', [
            'phone' => '09123456789',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'OTP sent successfully. Please check your phone.',
            ]);

        // Verify OTP was stored in cache
        $this->assertNotNull(Cache::get('password_reset_otp_09123456789'));
    }

    /** @test */
    public function it_returns_403_when_30_day_cooldown_is_active(): void
    {
        $role = Roles::where('name', 'citizen')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'last_sensitive_update_at' => Carbon::now()->subDays(15), // 15 days ago
        ]);
        CitizenDetails::factory()->create([
            'user_id' => $user->id,
            'phone_number' => '09123456789',
        ]);

        $response = $this->postJson('/api/v1/auth/password/request-otp', [
            'phone' => '09123456789',
        ]);

        $response->assertStatus(403)
            ->assertJsonStructure([
                'success',
                'message',
                'days_remaining',
            ])
            ->assertJson([
                'success' => false,
            ]);

        $this->assertStringContainsString('30 days', $response->json('message'));
    }

    /** @test */
    public function it_allows_reset_after_30_day_cooldown_expires(): void
    {
        $role = Roles::where('name', 'citizen')->first();
        $user = User::factory()->create([
            'role_id' => $role->id,
            'last_sensitive_update_at' => Carbon::now()->subDays(31), // 31 days ago
        ]);
        CitizenDetails::factory()->create([
            'user_id' => $user->id,
            'phone_number' => '09123456789',
        ]);

        $response = $this->postJson('/api/v1/auth/password/request-otp', [
            'phone' => '09123456789',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'OTP sent successfully. Please check your phone.',
            ]);
    }

    /** @test */
    public function it_validates_phone_number_format(): void
    {
        $response = $this->postJson('/api/v1/auth/password/request-otp', [
            'phone' => '1234', // Invalid format
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ]);
    }
}
