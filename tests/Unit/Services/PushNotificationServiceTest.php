<?php

namespace Tests\Unit\Services;

use App\Models\Roles;
use App\Models\User;
use App\Models\UserPushToken;
use App\Services\PushNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PushNotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_to_user_posts_to_expo_for_active_tokens_only(): void
    {
        Roles::factory()->create(['id' => 3, 'name' => 'Citizen']);
        $user = User::factory()->create(['role_id' => 3]);

        UserPushToken::create([
            'user_id' => $user->id,
            'user_type' => 'citizen',
            'provider' => 'expo',
            'platform' => 'android',
            'token' => 'ExponentPushToken[activeToken1234567890abcd]',
            'is_active' => true,
        ]);

        UserPushToken::create([
            'user_id' => $user->id,
            'user_type' => 'citizen',
            'provider' => 'expo',
            'platform' => 'android',
            'token' => 'ExponentPushToken[inactiveToken1234567890ab]',
            'is_active' => false,
        ]);

        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [
                    ['status' => 'ok', 'id' => 'ticket-123'],
                ],
            ], 200),
        ]);

        app(PushNotificationService::class)->sendToUser(
            $user->id,
            'citizen',
            'Concern Status: Ongoing',
            'Your concern status is now ongoing.',
            ['type' => 'concern_status_update', 'concernId' => 10]
        );

        Http::assertSent(function ($request) {
            $payload = $request->data();
            if (! is_array($payload) || ! isset($payload[0])) {
                return false;
            }

            return $request->url() === 'https://exp.host/--/api/v2/push/send'
                && $payload[0]['to'] === 'ExponentPushToken[activeToken1234567890abcd]';
        });
    }

    public function test_send_to_user_deactivates_device_not_registered_tokens(): void
    {
        Roles::factory()->create(['id' => 3, 'name' => 'Citizen']);
        $user = User::factory()->create(['role_id' => 3]);

        $token = UserPushToken::create([
            'user_id' => $user->id,
            'user_type' => 'citizen',
            'provider' => 'expo',
            'platform' => 'android',
            'token' => 'ExponentPushToken[invalidToken1234567890abcd]',
            'is_active' => true,
        ]);

        Http::fake([
            'https://exp.host/--/api/v2/push/send' => Http::response([
                'data' => [
                    [
                        'status' => 'error',
                        'message' => 'The recipient device is not registered.',
                        'details' => ['error' => 'DeviceNotRegistered'],
                    ],
                ],
            ], 200),
        ]);

        app(PushNotificationService::class)->sendToUser(
            $user->id,
            'citizen',
            'Concern Status: Resolved',
            'Your concern has been resolved.'
        );

        $token->refresh();
        $this->assertFalse($token->is_active);
    }
}

