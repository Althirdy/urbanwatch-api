<?php

namespace App\Services;

class TextBeeService
{
    protected $baseUrl = 'https://api.textbee.dev/api/v1';

    protected $apiKey;

    protected $deviceId;

    public function __construct($apiKey, $deviceId)
    {
        $this->apiKey = config('services.textbee.api_key', $apiKey);
        $this->deviceId = config('services.textbee.device_id', $deviceId);
    }

    public function sendSms($recipients, $message)
    {
        $endpoint = '/gateway/devices/'.$this->deviceId.'/send-sms';

        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'x-api-key' => $this->apiKey,
        ])->post($this->baseUrl.$endpoint, [
            'recipients' => $recipients,
            'message' => $message,
        ]);

        if ($response->successful()) {
            return $response->json();
        } else {
            \Illuminate\Support\Facades\Log::error('TextBee Send SMS Error: '.$response->body());

            return null;
        }
    }

    public function sendOtp($phoneNumber, $otpCode)
    {
        $message = "Your UrbanWatch verification code is: {$otpCode}. Valid for 5 minutes. Do not share this code.";

        $recipients = is_array($phoneNumber) ? $phoneNumber : [$phoneNumber];

        return $this->sendSms($recipients, $message);
    }

    public function sendConcernAssignedNotification($phoneNumber, $concernData)
    {
        $message = $this->formatConcernAssignedMessage($concernData);
        $recipients = is_array($phoneNumber) ? $phoneNumber : [$phoneNumber];

        return $this->sendSms($recipients, $message);
    }

    protected function formatConcernAssignedMessage(array $concernData): string
    {
        return "New Concern Assigned!\n".
               "Tracking Code: {$concernData['tracking_code']}\n".
               "Category: {$concernData['category']}\n".
               "Severity: {$concernData['severity']}\n".
               "Description: {$concernData['description']}\n".
               'Location: '.($concernData['address'] ?? $concernData['custom_location'] ?? 'Not specified').
               "\n\n".
               "Please address this concern promptly.\n".
               "Thank you,\nUrbanWatch System";
    }
}
