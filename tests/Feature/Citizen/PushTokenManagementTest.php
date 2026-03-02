<?php

namespace Tests\Feature\Citizen;

use App\Models\Roles;
use App\Models\User;
use App\Models\UserPushToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PushTokenManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $citizen;

    protected function setUp(): void
    {
        parent::setUp();

        Roles::factory()->create(['id' => 3, 'name' => 'Citizen']);
        $this->citizen = User::factory()->create(['role_id' => 3]);
    }

    public function test_can_register_push_token(): void
    {
        Sanctum::actingAs($this->citizen, ['access-api']);

        $payload = [
            'token' => 'ExponentPushToken[abcdefghijklmnopqrstuvwx]',
            'platform' => 'android',
            'device_id' => 'device-123',
            'app_version' => '1.0.0',
        ];

        $response = $this->postJson('/api/v1/notifications/push-token', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.token', $payload['token'])
            ->assertJsonPath('data.platform', 'android');

        $this->assertDatabaseHas('user_push_tokens', [
            'user_id' => $this->citizen->id,
            'user_type' => 'citizen',
            'provider' => 'expo',
            'token' => $payload['token'],
            'platform' => 'android',
            'is_active' => 1,
        ]);
    }

    public function test_register_updates_existing_token_record(): void
    {
        Sanctum::actingAs($this->citizen, ['access-api']);

        UserPushToken::create([
            'user_id' => $this->citizen->id,
            'user_type' => 'citizen',
            'provider' => 'expo',
            'token' => 'ExponentPushToken[abcdefghijklmnopqrstuvwx]',
            'platform' => 'android',
            'device_id' => 'old-device',
            'app_version' => '0.9.0',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/notifications/push-token', [
            'token' => 'ExponentPushToken[abcdefghijklmnopqrstuvwx]',
            'platform' => 'android',
            'device_id' => 'new-device',
            'app_version' => '1.2.0',
        ]);

        $response->assertStatus(200);

        $token = UserPushToken::where('token', 'ExponentPushToken[abcdefghijklmnopqrstuvwx]')->first();
        $this->assertNotNull($token);
        $this->assertTrue($token->is_active);
        $this->assertSame('new-device', $token->device_id);
        $this->assertSame('1.2.0', $token->app_version);
    }

    public function test_can_unregister_push_token(): void
    {
        Sanctum::actingAs($this->citizen, ['access-api']);

        UserPushToken::create([
            'user_id' => $this->citizen->id,
            'user_type' => 'citizen',
            'provider' => 'expo',
            'token' => 'ExponentPushToken[abcdefghijklmnopqrstuvwx]',
            'platform' => 'android',
            'is_active' => true,
        ]);

        $response = $this->deleteJson('/api/v1/notifications/push-token', [
            'token' => 'ExponentPushToken[abcdefghijklmnopqrstuvwx]',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.deactivated', true);

        $this->assertDatabaseHas('user_push_tokens', [
            'token' => 'ExponentPushToken[abcdefghijklmnopqrstuvwx]',
            'is_active' => 0,
        ]);
    }

    public function test_access_token_ability_is_required_for_push_token_routes(): void
    {
        Sanctum::actingAs($this->citizen, ['refresh-token']);

        $response = $this->postJson('/api/v1/notifications/push-token', [
            'token' => 'ExponentPushToken[abcdefghijklmnopqrstuvwx]',
            'platform' => 'android',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }
}

