<?php

namespace App\Http\Controllers\Api\V1\Yolo;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\FalseAlarm;
use App\Services\YoloAccidentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * YoloAccidentController
 *
 * Handles HTTP requests for CCTV-based accident detection via YOLO integration.
 * Business logic is delegated to YoloAccidentService for separation of concerns.
 *
 * Expected POST Parameters from Python YOLO script:
 * - snapshot (file, required): Image file captured from CCTV
 * - device_id (integer, optional): ID of the CCTV device from cctv_devices table
 *   - If not provided, uses TEST_DEVICE_ID for webcam testing
 * - detected_at (timestamp, optional): When the detection occurred
 *
 * Architecture:
 * Controller (thin) -> Service (business logic) -> [GeminiService, FileUploadService, Models]
 *
 * Flow:
 * 1. Validate HTTP request
 * 2. Delegate to YoloAccidentService
 * 3. Format and return HTTP response
 */
class YoloAccidentController extends BaseApiController
{
    protected $yoloService;

    // Hardcoded test device ID for webcam testing (change this to your actual test device ID)
    const TEST_DEVICE_ID = 1; // TODO: Update this after creating test CCTV device

    public function __construct(YoloAccidentService $yoloService)
    {
        $this->yoloService = $yoloService;
    }

    /**
     * Process snapshot from YOLO detection system.
     *
     * This endpoint now processes snapshots asynchronously.
     * It stores the image temporarily and dispatches a job for processing.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function ProcessSnapShot(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'snapshot' => 'required|file|image|max:10240', // Max 10MB
                'device_id' => 'required|integer|exists:cctv_devices,id',
                'detected_at' => 'nullable|date',
                'detected_classes' => 'nullable|array',
                'detected_classes.*' => 'string|in:CarCollision,Flood,Fire,Accident',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation failed', $validator->errors(), 422);
            }

            // Get parameters from Python YOLO script
            $file = $request->file('snapshot');
            $deviceId = $request->input('device_id');
            $detectedAt = $request->input('detected_at');
            $detectedClasses = $request->input('detected_classes', []);

            // Store file temporarily for async processing
            $tempPath = $file->store('temp_yolo', 'local');

            Log::info('YOLO Snapshot received - dispatching async job', [
                'deviceId' => $deviceId,
                'detectedAt' => $detectedAt,
                'detectedClasses' => $detectedClasses,
                'tempPath' => $tempPath,
                'fileSize' => $file->getSize(),
            ]);

            // Dispatch the job for async processing
            \App\Jobs\ProcessYoloSnapshotJob::dispatch(
                $tempPath,
                (int) $deviceId,
                $detectedAt,
                $file->getClientOriginalName(),
                $file->getMimeType() ?? 'image/jpeg',
                $file->getSize(),
                $detectedClasses
            );

            // Return immediately with 202 Accepted
            return $this->sendResponse([
                'success' => true,
                'message' => 'Snapshot received and queued for processing',
                'deviceId' => $deviceId,
            ], 'Snapshot queued for async processing', 202);

        } catch (\Exception $e) {
            Log::error('YoloAccidentController: Exception caught', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError(
                'Failed to queue detection: '.$e->getMessage(),
                null,
                500
            );
        }
    }

    /**
     * Get false alarm statistics and recent false alarms.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFalseAlarmStats(Request $request)
    {
        try {
            $deviceId = $request->input('device_id');

            // Base query
            $query = FalseAlarm::with('cctvDevice');

            // Filter by device if specified
            if ($deviceId) {
                $query->where('cctv_device_id', $deviceId);
            }

            // Get statistics
            $todayCount = (clone $query)->today()->count();
            $thisWeekCount = (clone $query)->thisWeek()->count();
            $thisHourCount = (clone $query)->thisHour()->count();

            // Get peak hour today
            $peakHour = FalseAlarm::today()
                ->when($deviceId, fn ($q) => $q->where('cctv_device_id', $deviceId))
                ->selectRaw('HOUR(created_at) as hour, COUNT(*) as count')
                ->groupBy('hour')
                ->orderByDesc('count')
                ->first();

            // Get breakdown by device
            $deviceBreakdown = FalseAlarm::today()
                ->with('cctvDevice:id,device_name')
                ->select('cctv_device_id', DB::raw('COUNT(*) as count'))
                ->groupBy('cctv_device_id')
                ->orderByDesc('count')
                ->get()
                ->map(function ($item) use ($todayCount) {
                    return [
                        'device_id' => $item->cctv_device_id,
                        'device_name' => $item->cctvDevice?->device_name ?? 'Unknown',
                        'count' => $item->count,
                        'percentage' => $todayCount > 0 ? round(($item->count / $todayCount) * 100, 1) : 0,
                    ];
                });

            // Get recent false alarms (last 20)
            $recentFalseAlarms = FalseAlarm::with('cctvDevice')
                ->when($deviceId, fn ($q) => $q->where('cctv_device_id', $deviceId))
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->map(function ($falseAlarm) {
                    return [
                        'id' => $falseAlarm->id,
                        'device_name' => $falseAlarm->cctvDevice?->device_name ?? 'Unknown',
                        'location_name' => $falseAlarm->cctvDevice?->location_name ?? 'Unknown',
                        'attempted_accident_type' => $falseAlarm->attempted_accident_type,
                        'gemini_reasoning' => $falseAlarm->gemini_reasoning,
                        'confidence_score' => $falseAlarm->confidence_score,
                        'detected_objects' => $falseAlarm->detected_objects,
                        'detected_at' => $falseAlarm->detected_at,
                        'created_at' => $falseAlarm->created_at,
                        'time_ago' => $falseAlarm->created_at->diffForHumans(),
                    ];
                });

            return $this->sendResponse([
                'statistics' => [
                    'today' => $todayCount,
                    'this_week' => $thisWeekCount,
                    'this_hour' => $thisHourCount,
                    'peak_hour' => $peakHour ? [
                        'hour' => $peakHour->hour,
                        'count' => $peakHour->count,
                        'formatted' => sprintf('%02d:00', $peakHour->hour),
                    ] : null,
                ],
                'device_breakdown' => $deviceBreakdown,
                'recent_false_alarms' => $recentFalseAlarms,
            ], 'False alarm statistics retrieved successfully');

        } catch (\Exception $e) {
            Log::error('YoloAccidentController: Error fetching false alarm stats', [
                'error' => $e->getMessage(),
            ]);

            return $this->sendError('Failed to fetch false alarm statistics', null, 500);
        }
    }

    /**
     * Get paginated list of false alarms with filters.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFalseAlarms(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'device_id' => 'nullable|integer|exists:cctv_devices,id',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            if ($validator->fails()) {
                return $this->sendError('Validation failed', $validator->errors(), 422);
            }

            $query = FalseAlarm::with('cctvDevice')
                ->orderByDesc('created_at');

            // Apply filters
            if ($request->has('device_id')) {
                $query->where('cctv_device_id', $request->input('device_id'));
            }

            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->input('date_from'));
            }

            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->input('date_to'));
            }

            $perPage = $request->input('per_page', 20);
            $falseAlarms = $query->paginate($perPage);

            // Transform the data
            $falseAlarms->getCollection()->transform(function ($falseAlarm) {
                return [
                    'id' => $falseAlarm->id,
                    'device_name' => $falseAlarm->cctvDevice?->device_name ?? 'Unknown',
                    'location_name' => $falseAlarm->cctvDevice?->location_name ?? 'Unknown',
                    'attempted_accident_type' => $falseAlarm->attempted_accident_type,
                    'gemini_reasoning' => $falseAlarm->gemini_reasoning,
                    'confidence_score' => $falseAlarm->confidence_score,
                    'detected_objects' => $falseAlarm->detected_objects,
                    'detected_at' => $falseAlarm->detected_at,
                    'created_at' => $falseAlarm->created_at,
                    'time_ago' => $falseAlarm->created_at->diffForHumans(),
                ];
            });

            return $this->sendResponse($falseAlarms, 'False alarms retrieved successfully');

        } catch (\Exception $e) {
            Log::error('YoloAccidentController: Error fetching false alarms', [
                'error' => $e->getMessage(),
            ]);

            return $this->sendError('Failed to fetch false alarms', null, 500);
        }
    }
}
