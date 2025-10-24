<?php

/**
 * INCIDENT MEDIA USAGE EXAMPLES
 * 
 * This file demonstrates how to use the new polymorphic IncidentMedia system
 * that handles media from three sources:
 * 1. Citizen Concerns
 * 2. UrbanWatch Device Snapshots  
 * 3. YOLO CCTV Detections
 */

use App\Models\IncidentMedia;
use App\Models\Citizen\Concern;
use App\Models\CctvDevices;
use Carbon\Carbon;

// ============================================================================
// 1. CITIZEN CONCERN MEDIA (from citizen reports)
// ============================================================================

// Create media from a citizen concern (updated way)
$concernMedia = IncidentMedia::createFromConcern($concern->id, [
    'media_type' => 'image',
    'original_path' => 'https://cloudinary.com/image.jpg',
    'public_id' => 'cloudinary_public_id',
    'original_filename' => 'user_photo.jpg',
    'file_size' => 1024000,
    'mime_type' => 'image/jpeg',
]);

// Or create manually
$concernMedia = IncidentMedia::create([
    'source_type' => Concern::class,
    'source_id' => $concern->id,
    'source_category' => 'citizen_concern',
    'media_type' => 'image',
    'original_path' => 'https://cloudinary.com/image.jpg',
    'captured_at' => now(),
    // ... other fields
]);

// ============================================================================
// 2. URBANWATCH DEVICE SNAPSHOTS (scheduled captures)
// ============================================================================

// Create media from a device snapshot
$snapshotMedia = IncidentMedia::createFromDeviceSnapshot($device->id, [
    'media_type' => 'image',
    'original_path' => 'https://storage.com/snapshot.jpg',
    'captured_at' => Carbon::parse('2025-10-24 14:30:00'),
    'file_size' => 2048000,
    'mime_type' => 'image/jpeg',
], 'DEVICE_001'); // device identifier

// ============================================================================
// 3. YOLO CCTV DETECTIONS (AI-detected incidents)
// ============================================================================

// Create media from YOLO detection with metadata
$detectionMedia = IncidentMedia::createFromYoloDetection($cctvDevice->id, [
    'media_type' => 'video',
    'original_path' => 'https://storage.com/detection_video.mp4',
    'captured_at' => Carbon::parse('2025-10-24 15:45:30'),
    'file_size' => 5120000,
    'mime_type' => 'video/mp4',
], [
    // YOLO detection metadata
    'detected_objects' => [
        [
            'class' => 'person',
            'confidence' => 0.95,
            'bounding_box' => [100, 200, 300, 400]
        ],
        [
            'class' => 'vehicle',
            'confidence' => 0.88,
            'bounding_box' => [400, 300, 600, 500]
        ]
    ],
    'incident_type' => 'accident',
    'severity_score' => 0.85,
    'detection_timestamp' => '2025-10-24T15:45:30Z'
], 'CCTV_MAIN_ST_001');

// ============================================================================
// QUERYING MEDIA BY SOURCE
// ============================================================================

// Get all media from citizen concerns
$citizenMedia = IncidentMedia::citizenConcerns()->get();

// Get all device snapshots
$deviceSnapshots = IncidentMedia::deviceSnapshots()->get();

// Get all YOLO detections
$yoloDetections = IncidentMedia::cctvDetections()->get();

// Get media by source category
$concernMedia = IncidentMedia::bySourceCategory('citizen_concern')->get();

// Get media for a specific concern
$concern = Concern::find(1);
$concernMedia = $concern->media; // Uses polymorphic relationship

// Get media for a specific CCTV device
$device = CctvDevices::find(1);
$deviceMedia = $device->media; // All media from this device
$deviceSnapshots = $device->snapshots; // Only snapshots
$deviceDetections = $device->detections; // Only YOLO detections

// ============================================================================
// COMPLEX QUERIES
// ============================================================================

// Get all incident media with source information
$mediaWithSources = IncidentMedia::with('source')->get();

// Get recent YOLO detections with high confidence
$recentDetections = IncidentMedia::cctvDetections()
    ->where('created_at', '>=', now()->subHours(24))
    ->whereJsonContains('detection_metadata->detected_objects', [
        ['confidence' => ['$gte' => 0.9]]
    ])
    ->get();

// Get media from a specific device in the last week
$deviceMediaRecent = IncidentMedia::where('source_type', CctvDevices::class)
    ->where('source_id', $deviceId)
    ->where('created_at', '>=', now()->subWeek())
    ->orderBy('captured_at', 'desc')
    ->get();

// ============================================================================
// ACCESSING SOURCE DATA
// ============================================================================

foreach ($mediaWithSources as $media) {
    switch ($media->source_category) {
        case 'citizen_concern':
            $concern = $media->source; // Gets the Concern model
            echo "Media from concern: {$concern->title}";
            break;
            
        case 'device_snapshot':
        case 'cctv_detection':
            $device = $media->source; // Gets the CctvDevices model
            echo "Media from device: {$device->device_name}";
            if ($media->source_category === 'cctv_detection') {
                $detections = $media->detection_metadata['detected_objects'] ?? [];
                echo "Detected " . count($detections) . " objects";
            }
            break;
    }
}