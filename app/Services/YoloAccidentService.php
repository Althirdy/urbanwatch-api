<?php

namespace App\Services;

use App\Events\FalseAlarmDetected;
use App\Models\Accident;
use App\Models\cctvDevices;
use App\Models\FalseAlarm;
use App\Models\IncidentMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class YoloAccidentService
{
    protected $geminiService;

    protected $fileUploadService;

    protected $routingService;

    public function __construct(
        GeminiService $geminiService,
        FileUploadService $fileUploadService,
        GeographicRoutingService $routingService
    ) {
        $this->geminiService = $geminiService;
        $this->fileUploadService = $fileUploadService;
        $this->routingService = $routingService;
    }

    /**
     * Main orchestrator for processing YOLO detections.
     *
     * @param  UploadedFile  $file  The snapshot image file
     * @param  int  $deviceId  ID of the CCTV device
     * @param  string|null  $detectedAt  When the detection occurred
     * @return array Processing result with success status and relevant data
     *
     * @throws \Exception If processing fails
     */
    public function processDetection(UploadedFile $file, int $deviceId, ?string $detectedAt = null): array
    {
        $fileContent = file_get_contents($file->getRealPath());
        $mimeType = $file->getMimeType() ?? 'image/jpeg';

        return $this->processDetectionInternal(
            $fileContent,
            $mimeType,
            $file,
            $deviceId,
            $detectedAt
        );
    }

    /**
     * Process detection from a stored file path (used by async Job).
     *
     * @param  string  $tempPath  Path to the stored temp file
     * @param  int  $deviceId  ID of the CCTV device
     * @param  string|null  $detectedAt  When the detection occurred
     * @param  string  $originalFilename  Original filename
     * @param  string  $mimeType  MIME type of the file
     * @param  int  $fileSize  Size of the file in bytes
     * @return array Processing result with success status and relevant data
     *
     * @throws \Exception If processing fails
     */
    public function processDetectionFromPath(
        string $tempPath,
        int $deviceId,
        ?string $detectedAt,
        string $originalFilename,
        string $mimeType,
        int $fileSize
    ): array {
        $fullPath = \Illuminate\Support\Facades\Storage::disk('local')->path($tempPath);

        if (! file_exists($fullPath)) {
            throw new \Exception("File not found at path: {$fullPath}");
        }

        $fileContent = file_get_contents($fullPath);

        // Create a temporary UploadedFile for compatibility with existing logic
        $tempFile = new UploadedFile(
            $fullPath,
            $originalFilename,
            $mimeType,
            null,
            true // Mark as test file to skip validation
        );

        return $this->processDetectionInternal(
            $fileContent,
            $mimeType,
            $tempFile,
            $deviceId,
            $detectedAt
        );
    }

    /**
     * Internal method for processing YOLO detections (DRY principle).
     *
     * @param  string  $fileContent  Raw binary content of the image
     * @param  string  $mimeType  MIME type of the image
     * @param  UploadedFile  $file  The file object for upload
     * @param  int  $deviceId  ID of the CCTV device
     * @param  string|null  $detectedAt  When the detection occurred
     * @return array Processing result
     *
     * @throws \Exception If processing fails
     */
    protected function processDetectionInternal(
        string $fileContent,
        string $mimeType,
        UploadedFile $file,
        int $deviceId,
        ?string $detectedAt
    ): array {
        $startTime = microtime(true);

        // Step 1: Fetch CCTV device with location
        $cctvDevice = $this->getCctvDeviceWithLocation($deviceId);

        // Step 2: Verify with Gemini AI before uploading
        $aiAnalysis = $this->verifyEmergencyWithAI($fileContent, $mimeType, $cctvDevice);

        // Step 3: Handle false alarm (no upload, no storage)
        if (! ($aiAnalysis['is_valid'] ?? false)) {
            return $this->handleFalseAlarm($aiAnalysis, $cctvDevice, microtime(true) - $startTime);
        }

        // Step 4: Valid emergency - Create accident records and upload image
        return $this->processValidEmergency($file, $aiAnalysis, $cctvDevice, $detectedAt, microtime(true) - $startTime);
    }

    /**
     * Fetch CCTV device with location relationship and validate.
     *
     *
     * @throws \Exception
     */
    protected function getCctvDeviceWithLocation(int $deviceId): cctvDevices
    {
        $cctvDevice = cctvDevices::find($deviceId);

        if (! $cctvDevice) {
            throw new \Exception("CCTV Device not found: ID {$deviceId}");
        }

        if (! $cctvDevice->latitude || ! $cctvDevice->longitude) {
            throw new \Exception("CCTV Device {$deviceId} has no coordinates assigned");
        }

        Log::info('YOLO Service: CCTV Device loaded', [
            'device_id' => $cctvDevice->id,
            'device_name' => $cctvDevice->device_name,
            'location' => $cctvDevice->location_name,
        ]);

        return $cctvDevice;
    }

    /**
     * Send image to Gemini AI for emergency verification.
     *
     * @param  string  $fileContent  Raw binary content of the image
     * @param  string  $mimeType  MIME type of the image
     * @param  cctvDevices  $cctvDevice  The CCTV device for context
     * @return array AI analysis result
     *
     * @throws \Exception
     */
    protected function verifyEmergencyWithAI(string $fileContent, string $mimeType, cctvDevices $cctvDevice): array
    {
        $context = [
            'device_name' => $cctvDevice->device_name,
            'location' => $cctvDevice->location_name,
        ];

        Log::info('YOLO Service: Sending image to Gemini AI for verification');

        $aiAnalysis = $this->geminiService->analyzeImage($fileContent, $mimeType, $context);

        if (! $aiAnalysis) {
            throw new \Exception('Gemini AI analysis failed or returned null');
        }

        Log::info('YOLO Service: Gemini AI analysis complete', [
            'is_valid' => $aiAnalysis['is_valid'] ?? false,
            'accident_type' => $aiAnalysis['accident_type'] ?? null,
            'confidence' => $aiAnalysis['confidence'] ?? null,
            'reasoning' => $aiAnalysis['reasoning'] ?? null,
        ]);

        return $aiAnalysis;
    }

    /**
     * Handle false alarm case - save to database, broadcast event, and return.
     *
     * @param  array  $aiAnalysis  The AI analysis result
     * @param  cctvDevices  $cctvDevice  The CCTV device
     * @param  float  $processingTime  Time taken in seconds
     * @return array Response data for false alarm
     */
    protected function handleFalseAlarm(array $aiAnalysis, cctvDevices $cctvDevice, float $processingTime): array
    {
        $processingTimeMs = round($processingTime * 1000, 2);

        // Save false alarm to database for tracking
        $falseAlarm = FalseAlarm::createFromDetection($cctvDevice->id, $aiAnalysis);

        Log::warning('YOLO Service: False alarm detected - Image discarded, no Cloudinary upload', [
            'false_alarm_id' => $falseAlarm->id,
            'device_id' => $cctvDevice->id,
            'device_name' => $cctvDevice->device_name,
            'reasoning' => $aiAnalysis['reasoning'] ?? 'Unknown',
            'processing_time_ms' => $processingTimeMs,
        ]);

        // Broadcast false alarm event for real-time monitoring
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
        ];
    }

    /**
     * Process valid emergency - upload image, create/update records, and broadcast.
     *
     * @param  UploadedFile  $file  The snapshot image file
     * @param  array  $aiAnalysis  The AI analysis result
     * @param  cctvDevices  $cctvDevice  The CCTV device
     * @param  string|null  $detectedAt  When the detection occurred
     * @param  float  $processingTime  Time taken so far in seconds
     * @return array Response data with accident details
     *
     * @throws \Exception
     */
    protected function processValidEmergency(
        UploadedFile $file,
        array $aiAnalysis,
        cctvDevices $cctvDevice,
        ?string $detectedAt,
        float $processingTime
    ): array {
        DB::beginTransaction();

        try {
            // Upload to Cloudinary (only for valid emergencies)
            Log::info('YOLO Service: Valid emergency verified - Uploading to Cloudinary');
            $uploadResult = $this->fileUploadService->uploadSingle($file, 'yolo');
            $publicUrl = $uploadResult['public_url'] ?? null;
            $storagePath = $uploadResult['storage_path'] ?? null;

            if (! $publicUrl) {
                throw new \Exception('Failed to upload image to Cloudinary');
            }

            Log::info('YOLO Service: Image uploaded successfully', ['url' => $publicUrl]);

            // Check for existing active accident of the same type on this device (Deduplication)
            $accidentType = $aiAnalysis['accident_type'] ?? 'Accident';
            $existingAccident = $this->findActiveAccident($cctvDevice->id, $accidentType);

            if ($existingAccident) {
                Log::info('YOLO Service: Active accident found. Updating existing record.', ['accident_id' => $existingAccident->id]);
                $accident = $this->updateExistingAccident($existingAccident, $aiAnalysis, $detectedAt);
                $isNew = false;
            } else {
                Log::info('YOLO Service: No active accident found. Creating new record.');
                $accident = $this->createNewAccident($cctvDevice, $aiAnalysis, $detectedAt);
                $isNew = true;
            }

            // Create incident media record
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
                    'device_id' => $cctvDevice->id,
                    'device_name' => $cctvDevice->device_name,
                    'ai_confidence' => $aiAnalysis['confidence'] ?? null,
                    'detected_objects' => $aiAnalysis['detected_objects'] ?? [],
                    'ai_reasoning' => $aiAnalysis['reasoning'] ?? null,
                ],
                'device_identifier' => $cctvDevice->device_name,
                'captured_at' => $detectedAt ?? now(),
            ]);

            DB::commit();

            // Broadcast the appropriate event
            if ($isNew) {
                broadcast(new \App\Events\AccidentDetected($accident));
            } else {
                broadcast(new \App\Events\AccidentUpdated($accident, $incidentMedia));
            }

            // Geographic Routing & Notification
            try {
                $routeData = $this->routingService->findPurokLeader($accident->latitude, $accident->longitude);

                if ($routeData && $routeData['leader']) {
                    $leaderDetails = $routeData['leader'];
                    Log::info("YOLO Service: Accident #{$accident->id} routed to Purok: {$routeData['purok']->name} (Leader ID: {$leaderDetails->user_id})");

                    if ($leaderDetails->contact_number) {
                        dispatch(new \App\Jobs\SendSmsNotificationJob(
                            $leaderDetails->contact_number,
                            [
                                'tracking_code' => 'ACC-'.$accident->id, // Pseudo-code for accidents
                                'category' => $accident->accident_type,
                                'severity' => $accident->severity,
                                'description' => $accident->description,
                                'address' => $cctvDevice->location_name ?? 'Unknown Location',
                                'custom_location' => '',
                            ]
                        ));
                    }
                } else {
                    Log::info("YOLO Service: Accident #{$accident->id} location not found in mapping. No automatic leader notification.");
                }
            } catch (\Exception $e) {
                Log::error("YOLO Service: Routing/Notification failed for Accident #{$accident->id}: ".$e->getMessage());
                // Non-blocking: Don't fail the whole process if notification fails
            }

            $processingTimeMs = round($processingTime * 1000, 2);

            return [
                'success' => true,
                'falseAlarm' => false,
                'isNew' => $isNew,
                'accidentId' => $accident->id,
                'mediaId' => $incidentMedia->id,
                'accidentType' => $accident->accident_type,
                'severity' => $accident->severity,
                'title' => $accident->title,
                'description' => $accident->description,
                'latitude' => $accident->latitude,
                'longitude' => $accident->longitude,
                'locationName' => $cctvDevice->location_name,
                'barangay' => null, // Removed: barangay no longer stored on cctv_devices
                'occurredAt' => $accident->occurred_at,
                'confidence' => $aiAnalysis['confidence'] ?? null,
                'detectedObjects' => $aiAnalysis['detected_objects'] ?? [],
                'processingTimeMs' => $processingTimeMs,
                'imageUrl' => $publicUrl,
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('YOLO Service: Error processing emergency', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Find an active accident on a specific device with matching type.
     */
    protected function findActiveAccident(int $deviceId, string $type): ?Accident
    {
        return Accident::where('cctv_device_id', $deviceId)
            ->where('accident_type', $type)
            ->whereIn('status', ['Pending', 'In Progress', 'pending', 'in progress'])
            ->latest()
            ->first();
    }

    /**
     * Create a new accident record.
     */
    protected function createNewAccident(cctvDevices $device, array $aiAnalysis, ?string $detectedAt): Accident
    {
        return Accident::create([
            'cctv_device_id' => $device->id,
            'title' => $aiAnalysis['title'] ?? 'Insidente na Natukoy',
            'description' => $aiAnalysis['description'] ?? 'Awtomatikong natukoy ng AI system',
            'latitude' => $device->latitude,
            'longitude' => $device->longitude,
            'occurred_at' => $detectedAt ?? now(),
            'accident_type' => $aiAnalysis['accident_type'] ?? 'Accident',
            'status' => 'Pending',
            'severity' => ucfirst(strtolower($aiAnalysis['severity'] ?? 'Medium')),
        ]);
    }

    /**
     * Update an existing accident with new AI data if it improves quality or urgency.
     */
    protected function updateExistingAccident(Accident $accident, array $aiAnalysis, ?string $detectedAt): Accident
    {
        $updates = [
            'occurred_at' => $detectedAt ?? now(),
        ];

        // Normalize new severity
        $newSeverityLabel = ucfirst(strtolower($aiAnalysis['severity'] ?? 'Low'));

        // Severity Escalation: Only update if the new detection is more severe
        $severityLevels = ['Low' => 1, 'Medium' => 2, 'High' => 3];
        $currentSeverity = $severityLevels[$accident->severity] ?? 1;
        $newSeverity = $severityLevels[$newSeverityLabel] ?? 1;

        if ($newSeverity > $currentSeverity) {
            $updates['severity'] = $newSeverityLabel;
            Log::info("YOLO Service: Severity escalated for accident {$accident->id}", [
                'from' => $accident->severity,
                'to' => $newSeverityLabel,
            ]);
        }

        // Smart Description Update: Update if new confidence is significantly higher
        $newConfidence = $aiAnalysis['confidence'] ?? 0;
        // We don't store confidence in Accident table yet, so we assume if it's > 85 it's worth updating title/desc
        if ($newConfidence > 85) {
            $updates['title'] = $aiAnalysis['title'];
            $updates['description'] = $aiAnalysis['description'];
        }

        $accident->update($updates);

        return $accident;
    }
}
