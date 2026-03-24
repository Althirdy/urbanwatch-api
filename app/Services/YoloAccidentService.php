<?php

namespace App\Services;

use App\Events\FalseAlarmDetected;
use App\Jobs\SendAccidentResponderAlertsJob;
use App\Models\Accident;
use App\Models\cctvDevices;
use App\Models\FalseAlarm;
use App\Models\IncidentMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class YoloAccidentService
{
    public function __construct(
        protected GeminiService $geminiService,
        protected FileUploadService $fileUploadService,
        protected GeographicRoutingService $routingService
    ) {}

    public function processDetection(
        UploadedFile $file,
        int $deviceId,
        ?string $detectedAt = null,
        array $detectedClasses = []
    ): array {
        $fileContent = file_get_contents($file->getRealPath());
        $mimeType = $file->getMimeType() ?? 'image/jpeg';

        return $this->processDetectionInternal(
            $fileContent,
            $mimeType,
            $file,
            $deviceId,
            $detectedAt,
            $detectedClasses
        );
    }

    public function processDetectionFromPath(
        string $tempPath,
        int $deviceId,
        ?string $detectedAt,
        string $originalFilename,
        string $mimeType,
        int $fileSize,
        array $detectedClasses = []
    ): array {
        $fullPath = Storage::disk('local')->path($tempPath);
        if (! file_exists($fullPath)) {
            throw new \Exception("File not found at path: {$fullPath}");
        }

        $fileContent = file_get_contents($fullPath);
        $tempFile = new UploadedFile(
            $fullPath,
            $originalFilename,
            $mimeType,
            null,
            true
        );

        return $this->processDetectionInternal(
            $fileContent,
            $mimeType,
            $tempFile,
            $deviceId,
            $detectedAt,
            $detectedClasses
        );
    }

    protected function processDetectionInternal(
        string $fileContent,
        string $mimeType,
        UploadedFile $file,
        int $deviceId,
        ?string $detectedAt,
        array $detectedClasses = []
    ): array {
        $startTime = microtime(true);
        $cctvDevice = $this->getCctvDeviceWithLocation($deviceId);
        $aiAnalysis = $this->verifyEmergencyWithAI($fileContent, $mimeType, $cctvDevice, $detectedClasses);

        $legitVerdicts = collect($aiAnalysis['class_verdicts'] ?? [])
            ->filter(fn ($verdict) => (bool) ($verdict['is_legit'] ?? false))
            ->values();
        $decisionTrace = $this->buildDecisionTrace($aiAnalysis, $legitVerdicts->count());
        $aiAnalysis = array_merge($aiAnalysis, $decisionTrace);

        if ($legitVerdicts->isEmpty()) {
            return $this->handleFalseAlarm(
                $aiAnalysis,
                $cctvDevice,
                microtime(true) - $startTime,
                $decisionTrace
            );
        }

        return $this->processValidEmergency(
            $file,
            $aiAnalysis,
            $legitVerdicts->all(),
            $cctvDevice,
            $detectedAt,
            microtime(true) - $startTime,
            $decisionTrace
        );
    }

    protected function getCctvDeviceWithLocation(int $deviceId): cctvDevices
    {
        $cctvDevice = cctvDevices::find($deviceId);
        if (! $cctvDevice) {
            throw new \Exception("CCTV Device not found: ID {$deviceId}");
        }

        if (! $cctvDevice->latitude || ! $cctvDevice->longitude) {
            throw new \Exception("CCTV Device {$deviceId} has no coordinates assigned");
        }

        return $cctvDevice;
    }

    protected function verifyEmergencyWithAI(
        string $fileContent,
        string $mimeType,
        cctvDevices $cctvDevice,
        array $detectedClasses = []
    ): array {
        $context = [
            'device_name' => $cctvDevice->device_name,
            'location' => $cctvDevice->location_name,
        ];

        $aiAnalysis = $this->geminiService->analyzeYoloImage($fileContent, $mimeType, $context, $detectedClasses);
        if (! $aiAnalysis) {
            throw new \Exception('Gemini AI analysis failed or returned null');
        }

        return $aiAnalysis;
    }

    protected function handleFalseAlarm(
        array $aiAnalysis,
        cctvDevices $cctvDevice,
        float $processingTime,
        array $decisionTrace = []
    ): array {
        $processingTimeMs = round($processingTime * 1000, 2);
        $attemptedClasses = collect($aiAnalysis['class_verdicts'] ?? [])
            ->pluck('source_class')
            ->filter()
            ->implode(',');
        $bestConfidence = collect($aiAnalysis['class_verdicts'] ?? [])
            ->pluck('confidence')
            ->filter(fn ($value) => is_numeric($value))
            ->max();
        $detectedObjects = collect($aiAnalysis['class_verdicts'] ?? [])
            ->pluck('detected_objects')
            ->flatten(1)
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        $falseAlarmPayload = array_merge($aiAnalysis, [
            'accident_type' => $attemptedClasses ?: ($aiAnalysis['accident_type'] ?? null),
            'confidence' => $bestConfidence,
            'detected_objects' => $detectedObjects,
        ], $decisionTrace);

        $falseAlarm = FalseAlarm::createFromDetection($cctvDevice->id, $falseAlarmPayload);

        broadcast(new FalseAlarmDetected($falseAlarm));

        return [
            'success' => true,
            'falseAlarm' => true,
            'falseAlarmId' => $falseAlarm->id,
            'message' => 'Detection verified as false alarm by AI - Image not stored',
            'reasoning' => $aiAnalysis['reasoning'] ?? 'Not a real emergency',
            'deviceName' => $cctvDevice->device_name,
            'location' => $cctvDevice->location_name,
            'processingTimeMs' => $processingTimeMs,
            'mode_applied' => $decisionTrace['mode_applied'] ?? null,
            'scene_type' => $decisionTrace['scene_type'] ?? null,
            'policy_adjusted' => (bool) ($decisionTrace['policy_adjusted'] ?? false),
            'legit_verdict_count' => (int) ($decisionTrace['legit_verdict_count'] ?? 0),
            'decision_reason' => $decisionTrace['decision_reason'] ?? 'no_legit_verdicts',
        ];
    }

    protected function processValidEmergency(
        UploadedFile $file,
        array $aiAnalysis,
        array $legitVerdicts,
        cctvDevices $cctvDevice,
        ?string $detectedAt,
        float $processingTime,
        array $decisionTrace = []
    ): array {
        DB::beginTransaction();

        try {
            $uploadResult = $this->fileUploadService->uploadSingle($file, 'yolo');
            $publicUrl = $uploadResult['public_url'] ?? null;
            $storagePath = $uploadResult['storage_path'] ?? null;
            if (! $publicUrl) {
                throw new \Exception('Failed to upload image to Cloudinary');
            }

            $results = [];
            $broadcastQueue = [];
            $useDemoLabel = $this->shouldUseDemoLabel($decisionTrace);
            foreach ($legitVerdicts as $verdict) {
                $accidentType = $verdict['accident_type'] ?? $verdict['normalized_class'] ?? 'Accident';
                if ($accidentType === 'CarCollision') {
                    $accidentType = 'Accident';
                }

                $existingAccident = $this->findActiveAccident($cctvDevice->id, $accidentType);
                if ($existingAccident) {
                    $accident = $this->updateExistingAccident($existingAccident, $verdict, $detectedAt, $useDemoLabel);
                    $isNew = false;
                } else {
                    $accident = $this->createNewAccident($cctvDevice, $verdict, $detectedAt, $accidentType, $useDemoLabel);
                    $isNew = true;
                }

                $incidentMedia = IncidentMedia::create([
                    'source_type' => Accident::class,
                    'source_id' => $accident->id,
                    'source_category' => 'cctv_detection',
                    'media_type' => 'image',
                    'original_path' => $publicUrl,
                    'blurred_path' => null,
                    'public_id' => $storagePath,
                    'original_filename' => $uploadResult['original_filename'] ?? $file->getClientOriginalName(),
                    'file_size' => $uploadResult['file_size'] ?? $file->getSize(),
                    'mime_type' => $uploadResult['mime_type'] ?? $file->getMimeType(),
                    'detection_metadata' => [
                        'detection_source' => 'yolo_with_gemini_ai',
                        'gemini_analysis' => $aiAnalysis,
                        'class_verdict' => $verdict,
                        'device_id' => $cctvDevice->id,
                        'device_name' => $cctvDevice->device_name,
                    ],
                    'device_identifier' => $cctvDevice->device_name,
                    'captured_at' => $detectedAt ?? now(),
                ]);

                $broadcastQueue[] = [
                    'event' => $isNew ? 'detected' : 'updated',
                    'accident_id' => $accident->id,
                    'incident_media_id' => $incidentMedia->id,
                ];

                SendAccidentResponderAlertsJob::dispatch(
                    $accident->id,
                    $verdict['source_class'] ?? $accidentType
                )->afterCommit();
                $this->dispatchLeaderNotification($accident, $cctvDevice);

                $results[] = [
                    'isNew' => $isNew,
                    'accidentId' => $accident->id,
                    'mediaId' => $incidentMedia->id,
                    'accidentType' => $accident->accident_type,
                    'severity' => $accident->severity,
                    'title' => $accident->title,
                    'description' => $accident->description,
                    'confidence' => $verdict['confidence'] ?? null,
                    'detectedObjects' => $verdict['detected_objects'] ?? [],
                ];
            }

            DB::commit();
            $this->broadcastAccidentEvents($broadcastQueue);

            $first = $results[0] ?? null;

            return [
                'success' => true,
                'falseAlarm' => false,
                'isNew' => $first['isNew'] ?? true,
                'accidentId' => $first['accidentId'] ?? null,
                'mediaId' => $first['mediaId'] ?? null,
                'accidentType' => $first['accidentType'] ?? null,
                'severity' => $first['severity'] ?? null,
                'title' => $first['title'] ?? null,
                'description' => $first['description'] ?? null,
                'confidence' => $first['confidence'] ?? null,
                'detectedObjects' => $first['detectedObjects'] ?? [],
                'results' => $results,
                'processingTimeMs' => round($processingTime * 1000, 2),
                'imageUrl' => $publicUrl,
                'mode_applied' => $decisionTrace['mode_applied'] ?? null,
                'scene_type' => $decisionTrace['scene_type'] ?? null,
                'policy_adjusted' => (bool) ($decisionTrace['policy_adjusted'] ?? false),
                'legit_verdict_count' => (int) ($decisionTrace['legit_verdict_count'] ?? 0),
                'decision_reason' => $decisionTrace['decision_reason'] ?? 'gemini_legit',
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('YOLO Service: Error processing emergency', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    protected function dispatchLeaderNotification(Accident $accident, cctvDevices $cctvDevice): void
    {
        try {
            $routeData = $this->routingService->findPurokLeader((float) $accident->latitude, (float) $accident->longitude);
            if (! $routeData || ! $routeData['leader'] || ! $routeData['leader']->contact_number) {
                return;
            }

            \App\Jobs\SendSmsNotificationJob::dispatch(
                $routeData['leader']->contact_number,
                [
                    'tracking_code' => 'ACC-'.$accident->id,
                    'category' => $accident->accident_type,
                    'severity' => $accident->severity,
                    'description' => $accident->description,
                    'address' => $cctvDevice->location_name ?? 'Unknown Location',
                    'custom_location' => '',
                ]
            )->afterCommit();
        } catch (\Exception $e) {
            Log::error("YOLO Service: Leader fallback notification failed for Accident #{$accident->id}: ".$e->getMessage());
        }
    }

    protected function findActiveAccident(int $deviceId, string $type): ?Accident
    {
        return Accident::where('cctv_device_id', $deviceId)
            ->where('accident_type', $type)
            ->whereIn('status', ['pending', 'in progress', 'Pending', 'In Progress'])
            ->latest()
            ->first();
    }

    protected function broadcastAccidentEvents(array $broadcastQueue): void
    {
        foreach ($broadcastQueue as $payload) {
            $accident = Accident::with('media')->find($payload['accident_id']);
            if (! $accident) {
                continue;
            }

            if ($payload['event'] === 'detected') {
                broadcast(new \App\Events\AccidentDetected($accident));

                continue;
            }

            $incidentMedia = IncidentMedia::find($payload['incident_media_id']);
            broadcast(new \App\Events\AccidentUpdated($accident, $incidentMedia));
        }
    }

    protected function createNewAccident(
        cctvDevices $device,
        array $verdict,
        ?string $detectedAt,
        string $accidentType,
        bool $useDemoLabel = false
    ): Accident {
        $title = $this->buildIncidentText(
            $verdict['title'] ?? null,
            'Insidente na Natukoy',
            $useDemoLabel
        );
        $description = $this->buildIncidentText(
            $verdict['description'] ?? null,
            'Awtomatikong natukoy ng AI system',
            $useDemoLabel
        );

        return Accident::create([
            'cctv_device_id' => $device->id,
            'title' => $title,
            'description' => $description,
            'latitude' => $device->latitude,
            'longitude' => $device->longitude,
            'occurred_at' => $detectedAt ?? now(),
            'accident_type' => $accidentType,
            'status' => 'Pending',
            'severity' => ucfirst(strtolower($verdict['severity'] ?? 'Medium')),
        ]);
    }

    protected function updateExistingAccident(
        Accident $accident,
        array $verdict,
        ?string $detectedAt,
        bool $useDemoLabel = false
    ): Accident {
        $updates = ['occurred_at' => $detectedAt ?? now()];
        $newSeverityLabel = ucfirst(strtolower($verdict['severity'] ?? 'Low'));

        $severityLevels = ['Low' => 1, 'Medium' => 2, 'High' => 3];
        $currentSeverity = $severityLevels[$accident->severity] ?? 1;
        $newSeverity = $severityLevels[$newSeverityLabel] ?? 1;
        if ($newSeverity > $currentSeverity) {
            $updates['severity'] = $newSeverityLabel;
        }

        $newConfidence = $verdict['confidence'] ?? 0;
        if ($newConfidence > 85) {
            $updates['title'] = $this->buildIncidentText(
                $verdict['title'] ?? $accident->title,
                $accident->title ?? 'Insidente na Natukoy',
                $useDemoLabel
            );
            $updates['description'] = $this->buildIncidentText(
                $verdict['description'] ?? $accident->description,
                $accident->description ?? 'Awtomatikong natukoy ng AI system',
                $useDemoLabel
            );
        } elseif ($useDemoLabel) {
            $updates['title'] = $this->buildIncidentText(
                $accident->title,
                'Insidente na Natukoy',
                true
            );
            $updates['description'] = $this->buildIncidentText(
                $accident->description,
                'Awtomatikong natukoy ng AI system',
                true
            );
        }

        $accident->update($updates);

        return $accident;
    }

    protected function buildDecisionTrace(array $aiAnalysis, int $legitVerdictCount): array
    {
        return [
            'mode_applied' => $aiAnalysis['mode_applied'] ?? null,
            'scene_type' => $aiAnalysis['scene_type'] ?? 'uncertain',
            'policy_adjusted' => (bool) ($aiAnalysis['policy_adjusted'] ?? false),
            'legit_verdict_count' => $legitVerdictCount,
            'decision_reason' => $legitVerdictCount > 0
                ? ((bool) ($aiAnalysis['policy_adjusted'] ?? false) ? 'policy_promoted' : 'gemini_legit')
                : 'no_legit_verdicts',
        ];
    }

    protected function shouldUseDemoLabel(array $decisionTrace): bool
    {
        return ($decisionTrace['mode_applied'] ?? null) === 'DEMO_SIMULATION';
    }

    protected function buildIncidentText(?string $value, string $fallback, bool $useDemoLabel): string
    {
        $text = trim((string) ($value ?: $fallback));
        if (! $useDemoLabel) {
            return $text;
        }

        return $this->prefixDemoLabel($text);
    }

    protected function prefixDemoLabel(string $text): string
    {
        if (preg_match('/^\[demo\]\s*/i', $text) === 1) {
            return preg_replace('/^\[demo\]\s*/i', '[demo] ', $text) ?: $text;
        }

        return '[demo] '.$text;
    }
}
