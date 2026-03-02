<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Notifications\RegisterPushTokenRequest;
use App\Http\Requests\Api\V1\Notifications\UnregisterPushTokenRequest;
use App\Models\Notification;
use App\Models\UserPushToken;

class PushTokenController extends BaseApiController
{
    public function register(RegisterPushTokenRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        $userType = $user->role_id === 2
            ? Notification::USER_TYPE_PUROK_LEADER
            : Notification::USER_TYPE_CITIZEN;

        $token = UserPushToken::updateOrCreate(
            ['token' => $validated['token']],
            [
                'user_id' => $user->id,
                'user_type' => $userType,
                'provider' => $validated['provider'] ?? 'expo',
                'platform' => $validated['platform'],
                'device_id' => $validated['device_id'] ?? null,
                'app_version' => $validated['app_version'] ?? null,
                'is_active' => true,
                'last_seen_at' => now(),
            ]
        );

        return $this->sendResponse([
            'id' => $token->id,
            'token' => $token->token,
            'platform' => $token->platform,
            'provider' => $token->provider,
            'is_active' => $token->is_active,
        ], 'Push token registered successfully');
    }

    public function unregister(UnregisterPushTokenRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();

        $updated = UserPushToken::where('user_id', $user->id)
            ->where('token', $validated['token'])
            ->update([
                'is_active' => false,
                'last_seen_at' => now(),
            ]);

        if (! $updated) {
            return $this->sendNotFound('Push token not found.');
        }

        return $this->sendResponse([
            'token' => $validated['token'],
            'deactivated' => true,
        ], 'Push token unregistered successfully');
    }
}
