<?php

namespace App\Jobs;

use App\Services\TextBeeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendSmsNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public $backoff = [30, 60, 120];

    public $contactNumber;

    public $data;

    /**
     * Create a new job instance.
     */
    public function __construct(string $contactNumber, array $data)
    {
        $this->contactNumber = $contactNumber;
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(TextBeeService $textBeeService)
    {
        try {
            $textBeeService->sendConcernAssignedNotification(
                $this->contactNumber,
                $this->data
            );

            Log::info("SMS Notification sent successfully to {$this->contactNumber}");
        } catch (\Exception $e) {
            Log::error("Failed to send SMS notification to {$this->contactNumber}: ".$e->getMessage());
            throw $e;
        }
    }
}
