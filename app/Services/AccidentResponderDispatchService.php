<?php

namespace App\Services;

use App\Models\Accident;
use App\Models\AccidentResponderNotification;
use App\Models\Contact;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AccidentResponderDispatchService
{
    public function __construct(protected TextBeeService $textBeeService) {}

    public function dispatchForAccidentClass(Accident $accident, string $incidentClass): void
    {
        if ($this->isInCooldown($accident->id, $incidentClass)) {
            AccidentResponderNotification::create([
                'accident_id' => $accident->id,
                'incident_class' => $incidentClass,
                'status' => 'skipped_cooldown',
            ]);

            return;
        }

        $contacts = $this->resolveContacts($accident, $incidentClass);
        if ($contacts->isEmpty()) {
            AccidentResponderNotification::create([
                'accident_id' => $accident->id,
                'incident_class' => $incidentClass,
                'status' => 'skipped_no_contacts',
            ]);

            return;
        }

        $message = $this->buildSmsMessage($accident, $incidentClass);
        foreach ($contacts as $contact) {
            $this->sendToContact($accident, $incidentClass, $contact, $message);
        }
    }

    protected function isInCooldown(int $accidentId, string $incidentClass): bool
    {
        $cooldownMinutes = (int) config('yolo.sms_cooldown_minutes', 15);

        return AccidentResponderNotification::where('accident_id', $accidentId)
            ->where('incident_class', $incidentClass)
            ->where('status', 'sent')
            ->where('sent_at', '>=', now()->subMinutes($cooldownMinutes))
            ->exists();
    }

    protected function resolveContacts(Accident $accident, string $incidentClass): Collection
    {
        $responderTypes = collect(config('yolo.responder_mapping', []))
            ->get($incidentClass, []);

        if (empty($responderTypes)) {
            return collect();
        }

        return Contact::active()
            ->whereIn('responder_type', $responderTypes)
            ->get();
    }

    protected function buildSmsMessage(Accident $accident, string $incidentClass): string
    {
        $lat = $accident->latitude;
        $lng = $accident->longitude;
        $mapsUrl = "https://maps.google.com/?q={$lat},{$lng}";

        return "UrbanWatch ALERT: {$incidentClass}\n".
            "Severity: {$accident->severity}\n".
            "Location: {$lat}, {$lng}\n".
            "Map: {$mapsUrl}\n".
            "Ref: ACC-{$accident->id}";
    }

    protected function sendToContact(Accident $accident, string $incidentClass, Contact $contact, string $message): void
    {
        $primaryResponse = $this->textBeeService->sendSms([$contact->primary_mobile], $message);

        if ($primaryResponse) {
            AccidentResponderNotification::create([
                'accident_id' => $accident->id,
                'incident_class' => $incidentClass,
                'contact_id' => $contact->id,
                'phone_used' => $contact->primary_mobile,
                'send_target' => 'primary',
                'status' => 'sent',
                'provider_response' => $primaryResponse,
                'sent_at' => now(),
            ]);

            return;
        }

        if ($contact->backup_mobile) {
            $backupResponse = $this->textBeeService->sendSms([$contact->backup_mobile], $message);

            if ($backupResponse) {
                AccidentResponderNotification::create([
                    'accident_id' => $accident->id,
                    'incident_class' => $incidentClass,
                    'contact_id' => $contact->id,
                    'phone_used' => $contact->backup_mobile,
                    'send_target' => 'backup',
                    'status' => 'sent',
                    'provider_response' => $backupResponse,
                    'sent_at' => now(),
                ]);

                return;
            }
        }

        AccidentResponderNotification::create([
            'accident_id' => $accident->id,
            'incident_class' => $incidentClass,
            'contact_id' => $contact->id,
            'phone_used' => $contact->primary_mobile,
            'send_target' => 'primary',
            'status' => 'failed',
        ]);

        Log::warning('Responder SMS failed for contact', [
            'accident_id' => $accident->id,
            'incident_class' => $incidentClass,
            'contact_id' => $contact->id,
        ]);
    }
}
