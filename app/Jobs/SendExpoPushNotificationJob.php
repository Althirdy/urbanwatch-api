<?php

namespace App\Jobs;

use App\Services\PushNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendExpoPushNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 120, 300];

    public function __construct(
        public int $userId,
        public string $userType,
        public string $title,
        public string $body,
        public array $data = []
    ) {}

    public function handle(PushNotificationService $pushNotificationService): void
    {
        $pushNotificationService->sendToUser(
            $this->userId,
            $this->userType,
            $this->title,
            $this->body,
            $this->data
        );
    }
}

