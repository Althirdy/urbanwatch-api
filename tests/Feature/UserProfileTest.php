<?php

use App\Models\User;
use App\Services\AbstractApiService;
use App\Services\UserProfileService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use App\Jobs\SendOtpJob;

uses(Tests\TestCase::class);
// uses(RefreshDatabase::class); // Cannot use RefreshDatabase as no DB connection in this env usually, but let's assume standard testing practices.

beforeEach(function () {
    // Mock AbstractApiService
    $this->abstractMock = Mockery::mock(AbstractApiService::class);
    $this->app->instance(AbstractApiService::class, $this->abstractMock);
});

test('user cannot request update if in cooldown period', function () {
    $user = User::factory()->create([
        'last_sensitive_update_at' => now()->subDays(10), // 20 days left
        'phone_number' => '09170000000',
    ]);
    
    $this->actingAs($user);

    $response = $this->postJson('/api/v1/profile/request-update-otp', [
        'type' => 'email',
        'value' => 'new@example.com'
    ]);

    $response->assertStatus(403)
        ->assertJsonFragment(['message' => 'For security, you can only update your contact information once every 30 days. Please try again in 20 days.']);
});

test('user can request update if cooldown passed', function () {
    Queue::fake();
    
    $user = User::factory()->create([
        'last_sensitive_update_at' => now()->subDays(31),
        'phone_number' => '09170000000',
    ]);
    
    $this->actingAs($user);

    // Mock Abstract API success
    $this->abstractMock->shouldReceive('validateEmail')
        ->once()
        ->with('new@example.com')
        ->andReturn(['valid' => true, 'deliverable' => true, 'disposable' => false]);

    $response = $this->postJson('/api/v1/profile/request-update-otp', [
        'type' => 'email',
        'value' => 'new@example.com'
    ]);

    $response->assertStatus(200)
        ->assertJsonFragment(['message' => 'OTP sent successfully.']);
        
    Queue::assertPushed(SendOtpJob::class);
});

test('email update requires abstract api validation', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    // Mock Abstract API failure
    $this->abstractMock->shouldReceive('validateEmail')
        ->once()
        ->andReturn(['valid' => false, 'deliverable' => false, 'disposable' => true]);

    $response = $this->postJson('/api/v1/profile/request-update-otp', [
        'type' => 'email',
        'value' => 'bad@example.com'
    ]);

    $response->assertStatus(422)
        ->assertJsonFragment(['message' => 'The provided email address is invalid or disposable.']);
});

test('otp verification updates user and sets cooldown', function () {
    $user = User::factory()->create(['email' => 'old@example.com']);
    $this->actingAs($user);

    // Manually set cache as if OTP was requested
    $otp = '123456';
    $newValue = 'new@example.com';
    $cacheKey = "profile_update_otp_{$user->id}_email";
    
    Cache::put($cacheKey, [
        'otp' => $otp,
        'new_value' => $newValue,
    ], 600);

    $response = $this->putJson('/api/v1/profile/contact-info', [
        'type' => 'email',
        'otp' => $otp,
    ]);

    $response->assertStatus(200);

    $user->refresh();
    expect($user->email)->toBe($newValue);
    expect($user->last_sensitive_update_at)->not->toBeNull();
});

test('wrong otp fails update', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $cacheKey = "profile_update_otp_{$user->id}_email";
    Cache::put($cacheKey, ['otp' => '123456', 'new_value' => 'new@example.com'], 600);

    $response = $this->putJson('/api/v1/profile/contact-info', [
        'type' => 'email',
        'otp' => '000000', // Wrong OTP
    ]);

    $response->assertStatus(400);
});
