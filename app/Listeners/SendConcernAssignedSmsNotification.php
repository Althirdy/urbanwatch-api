<?php

namespace App\Listeners;

use App\Events\ConcernAssigned;
use App\Services\TextBeeService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendConcernAssignedSmsNotification implements ShouldQueue
{
    use InteractsWithQueue;

    protected TextBeeService $textBeeService;

    protected $tries = 3;

    protected $backoff = 60;

    /**
     * Create the event listener.
     */
    public function __construct(TextBeeService $textBeeService)
    {
        $this->textBeeService = $textBeeService;
    }

    /**
     * Handle the event.
     */
    public function handle(ConcernAssigned $event): void
    {
        // Check if SMS notifications are enabled
        if (! config('services.textbee.sms_notification_enabled', true)) {
            Log::info('SMS notification skipped (disabled in config)', [
                'concern_id' => $event->concern->id,
                'tracking_code' => $event->concern->tracking_code,
            ]);

            return;
        }

        try {
            $concern = $event->concern;
            $distribution = $event->distribution;
            $purokLeader = $distribution->purokLeader;
            if (! $purokLeader) {
                Log::warning('Purok Leader not found for distribution', [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'purok_leader_id' => $distribution->purok_leader_id,
                ]);

                return;
            }
            // Get contact number from officialDetails
            $officialDetails = $purokLeader->officialDetails;
            $contactNumber = $officialDetails->contact_number ?? null;
            if (! $contactNumber) {
                Log::warning('Purok Leader contact number not found', [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'purok_leader_id' => $purokLeader->id,
                ]);

                return;
            }

            $concernData = [
                'tracking_code' => $concern->tracking_code,
                'description' => $concern->description,
                'category' => $concern->category,
                'severity' => $concern->severity,
                'address' => $concern->address,
                'custom_location' => $concern->custom_location,
            ];

            $result = $this->textBeeService->sendConcernAssignedNotification(
                $contactNumber,
                $concernData
            );
            if ($result) {
                Log::info('SMS notification sent successfully', [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'purok_leader_id' => $purokLeader->id,
                    'phone_number' => $this->maskPhoneNumber($contactNumber),
                ]);
            } else {
                Log::error('Failed to send SMS notification', [
                    'concern_id' => $concern->id,
                    'tracking_code' => $concern->tracking_code,
                    'purok_leader_id' => $purokLeader->id,
                    'contact_number' => $this->maskPhoneNumber($contactNumber),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send SMS notification for ConcernAssigned event', [
                'error' => $e->getMessage(),
                'concern_id' => $event->concern->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    public function failed(ConcernAssigned $event, \Throwable $exception): void
    {
        Log::error('Failed to send SMS notification after all retries', [
            'concern_id' => $event->concern->id,
            'tracking_code' => $event->concern->tracking_code,
            'error' => $exception->getMessage(),
        ]);
    }

    protected function maskPhoneNumber(string $phoneNumber): string
    {
        if (strlen($phoneNumber) <= 4) {
            return $phoneNumber;
        }

        return substr($phoneNumber, 0, 4).str_repeat('*', strlen($phoneNumber) - 4);
    }
}
