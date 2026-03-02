<?php

namespace App\Services;

use App\Models\UserPushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

    public function sendToUser(
        int $userId,
        string $userType,
        string $title,
        string $body,
        array $data = []
    ): void {
        $tokens = UserPushToken::query()
            ->active()
            ->where('user_id', $userId)
            ->where('user_type', $userType)
            ->where('provider', 'expo')
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        foreach (array_chunk($tokens, 100) as $batch) {
            $this->sendExpoBatch($batch, $title, $body, $data);
        }
    }

    /**
     * @param  array<int, string>  $tokens
     */
    private function sendExpoBatch(array $tokens, string $title, string $body, array $data): void
    {
        $messages = array_map(function (string $token) use ($title, $body, $data) {
            return [
                'to' => $token,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'priority' => 'high',
                'ttl' => 86400,
                'channelId' => 'concern-updates',
            ];
        }, $tokens);

        $client = Http::timeout(15)
            ->acceptJson()
            ->asJson();

        $accessToken = config('services.expo.access_token');
        if (is_string($accessToken) && $accessToken !== '') {
            $client = $client->withToken($accessToken);
        }

        $response = $client->post(self::EXPO_PUSH_API_URL, $messages);

        if ($response->failed()) {
            Log::error('Expo push request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return;
        }

        $this->handleExpoResponse($tokens, $response->json());
    }

    /**
     * @param  array<int, string>  $tokens
     * @param  array<string, mixed>  $payload
     */
    private function handleExpoResponse(array $tokens, array $payload): void
    {
        $items = $payload['data'] ?? [];
        if (! is_array($items)) {
            return;
        }

        $invalidTokens = [];
        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                continue;
            }

            $status = $item['status'] ?? null;
            if ($status !== 'error') {
                continue;
            }

            $errorCode = $item['details']['error'] ?? null;
            if ($errorCode === 'DeviceNotRegistered' && isset($tokens[$index])) {
                $invalidTokens[] = $tokens[$index];
            }

            Log::warning('Expo push item returned error', [
                'token' => $tokens[$index] ?? null,
                'message' => $item['message'] ?? 'Unknown Expo error',
                'details' => $item['details'] ?? null,
            ]);
        }

        if (! empty($invalidTokens)) {
            UserPushToken::query()
                ->whereIn('token', $invalidTokens)
                ->update([
                    'is_active' => false,
                    'last_seen_at' => now(),
                ]);
        }
    }
}

