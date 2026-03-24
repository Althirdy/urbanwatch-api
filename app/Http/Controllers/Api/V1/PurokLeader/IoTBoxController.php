<?php

namespace App\Http\Controllers\Api\V1\PurokLeader;

use App\Events\AnomalyLogCreated;
use App\Http\Controllers\Api\BaseApiController;
use App\Models\AnomalyLog;
use App\Models\Purok;
use App\Models\UwDevice;
use App\Services\FileUploadService;
use App\Services\NotificationService;
use App\Services\UwDeviceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class IoTBoxController extends BaseApiController
{
    protected FileUploadService $fileUploadService;

    protected UwDeviceService $uwDeviceService;

    protected NotificationService $notificationService;

    public function __construct(
        FileUploadService $fileUploadService,
        UwDeviceService $uwDeviceService,
        NotificationService $notificationService
    ) {
        $this->fileUploadService = $fileUploadService;
        $this->uwDeviceService = $uwDeviceService;
        $this->notificationService = $notificationService;
    }

    /**
     * Receive anomaly data from registered IoT box.
     * The IoT box must be registered (have a matching device_id) before sending data.
     */
    public function storeAnomalyLog(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'device_id' => 'required',
            'anomaly_type' => 'required|in:sound_anomaly,anti_tampering',
            'image' => 'nullable|image|max:10240', // Max 10MB
            'video' => 'nullable|file|mimetypes:video/mp4,video/quicktime,video/x-msvideo,video/webm|max:51200', // Max 50MB
            'details' => 'nullable|array',
        ], [
            'device_id.required' => 'Device ID is required.',
            'anomaly_type.required' => 'Anomaly type is required.',
            'anomaly_type.in' => 'Anomaly type must be sound_anomaly or anti_tampering.',
            'image.image' => 'The file must be an image.',
            'image.max' => 'Image must not exceed 10MB.',
            'video.file' => 'The file must be a valid video.',
            'video.mimetypes' => 'Video must be mp4, mov, avi, or webm format.',
            'video.max' => 'Video must not exceed 50MB.',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors());
        }

        DB::beginTransaction();

        try {
            // Authenticate IoT box via Token in Header
            $token = $request->header('X-Device-Token');

            if (! $token) {
                return $this->sendError('Device token is missing.', null, 401);
            }

            // Cast device_id to string for consistency (IoT box may send as integer or string)
            $deviceId = (string) $request->device_id;

            // use service to verify and update heartbeat
            $iotBox = $this->uwDeviceService->verifyAndHeartbeat($deviceId, $token);

            if (! $iotBox) {
                Log::warning('Unregistered, inactive, or invalid token IoT box attempted to send data', [
                    'device_id' => $deviceId,
                    'ip' => $request->ip(),
                ]);

                return $this->sendError('IoT box is not registered, inactive, or token is invalid.', null, 403);
            }

            $storageDisk = $this->resolveStorageDisk();
            $details = $request->input('details', []);

            // Handle image upload if provided
            $imagePath = null;
            $imagePublicUrl = null;
            if ($request->hasFile('image')) {
                try {
                    $directory = 'anomaly_logs';
                    $disk = Storage::disk($storageDisk);

                    if (! $disk->exists($directory)) {
                        $disk->makeDirectory($directory);
                    }

                    // Use FileUploadService for optimized upload
                    $uploadResult = $this->fileUploadService->uploadSingle(
                        $request->file('image'),
                        $directory
                    );
                    $imagePath = $uploadResult['storage_path'];
                    $imagePublicUrl = $uploadResult['public_url'] ?? null;

                    // Verify file was actually saved
                    if (! $disk->exists($imagePath)) {
                        // Fallback: Direct storage if service failed
                        Log::warning('FileUploadService image verification failed, using fallback storage', [
                            'disk' => $storageDisk,
                            'path' => $imagePath,
                        ]);

                        $imagePath = $request->file('image')->store($directory, $storageDisk);
                        $imagePublicUrl = $disk->url($imagePath);
                    }

                    Log::info('Image saved successfully', [
                        'disk' => $storageDisk,
                        'path' => $imagePath,
                        'exists' => $disk->exists($imagePath),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Image upload failed', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    // Continue without image rather than failing the entire request
                    $imagePath = null;
                    $imagePublicUrl = null;
                }
            }

            // Handle video upload if provided (stored in details JSON, no schema change needed)
            if ($request->hasFile('video')) {
                try {
                    $directory = 'anomaly_videos';
                    $disk = Storage::disk($storageDisk);

                    if (! $disk->exists($directory)) {
                        $disk->makeDirectory($directory);
                    }

                    $videoUploadResult = $this->fileUploadService->uploadSingle(
                        $request->file('video'),
                        $directory
                    );

                    $videoPath = $videoUploadResult['storage_path'];
                    $videoPublicUrl = $videoUploadResult['public_url'] ?? null;

                    if (! $disk->exists($videoPath)) {
                        Log::warning('FileUploadService video verification failed, using fallback storage', [
                            'disk' => $storageDisk,
                            'path' => $videoPath,
                        ]);

                        $videoPath = $request->file('video')->store($directory, $storageDisk);
                        $videoPublicUrl = $disk->url($videoPath);
                    }

                    $details['video'] = [
                        'storage_path' => $videoPath,
                        'public_url' => $videoPublicUrl,
                        'mime_type' => $videoUploadResult['mime_type'] ?? $request->file('video')->getMimeType(),
                        'file_size' => $videoUploadResult['file_size'] ?? $request->file('video')->getSize(),
                        'original_filename' => $videoUploadResult['original_filename'] ?? $request->file('video')->getClientOriginalName(),
                    ];

                    Log::info('Video saved successfully', [
                        'disk' => $storageDisk,
                        'path' => $videoPath,
                        'exists' => $disk->exists($videoPath),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Video upload failed', [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }

            // Check for existing parent anomaly to group with (same IoT box, same type, within 30 minutes)
            $parentAnomaly = AnomalyLog::where('iot_box_id', $iotBox->id)
                ->where('anomaly_type', $request->anomaly_type)
                ->where('is_duplicate', false)
                ->where('parent_anomaly_id', null) // Must be a parent anomaly
                ->where('created_at', '>=', now()->subMinutes(30))
                ->orderBy('created_at', 'desc')
                ->first();

            $isDuplicate = $parentAnomaly !== null;

            // Create anomaly log
            $anomalyLog = AnomalyLog::create([
                'device_id' => $deviceId, // Store the device_id sent by IoT box
                'iot_box_id' => $iotBox->id,
                'anomaly_type' => $request->anomaly_type,
                'image' => $imagePath,
                'details' => $details,
                'is_confirmed' => false,
                'parent_anomaly_id' => $parentAnomaly?->id,
                'is_duplicate' => $isDuplicate,
            ]);

            Log::info('Anomaly log created from IoT box', [
                'anomaly_log_id' => $anomalyLog->id,
                'iot_box_id' => $iotBox->id,
                'device_id' => $deviceId,
                'anomaly_type' => $request->anomaly_type,
                'is_duplicate' => $isDuplicate,
                'parent_anomaly_id' => $parentAnomaly?->id,
            ]);

            DB::commit();

            // Broadcast real-time event for mobile app
            event(new AnomalyLogCreated($anomalyLog));

            // Send push notifications only for new parent anomalies (not duplicates)
            if (! $isDuplicate) {
                $this->notificationService->notifyAnomalyDetected($anomalyLog, $iotBox);
            }

            return $this->sendResponse([
                'anomaly_log_id' => $anomalyLog->id,
                'iot_box' => [
                    'id' => $iotBox->id,
                    'device_name' => $iotBox->device_name,
                    'location' => $iotBox->display_location,
                    'latitude' => $iotBox->latitude,
                    'longitude' => $iotBox->longitude,
                ],
                'anomaly_type' => $anomalyLog->anomaly_type,
                'is_duplicate' => $isDuplicate,
                'parent_anomaly_id' => $parentAnomaly?->id,
                'image_url' => $imagePublicUrl,
                'video' => data_get($anomalyLog->details, 'video'),
                'created_at' => $anomalyLog->created_at->toISOString(),
            ], 'Anomaly log recorded successfully', 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating anomaly log', [
                'error' => $e->getMessage(),
                'device_id' => $request->device_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->sendError('Failed to record anomaly log: '.$e->getMessage());
        }
    }

    /**
     * Get anomaly logs within the purok leader's territory.
     * Filters anomalies based on the authenticated user's assigned purok boundary.
     * Only returns parent anomalies (non-duplicates) with related anomaly counts.
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $query = AnomalyLog::with('iotBox')
                ->parentsOnly() // Only show parent anomalies, not duplicates
                ->withCount('relatedAnomalies') // Include count of related/duplicate anomalies
                ->orderBy('created_at', 'desc');

            // Territory filtering: If user is a purok leader, only show anomalies from their territory
            if ($user->role_id === 2) {
                // Get the purok leader's assigned purok
                $purokId = $user->officialDetails?->purok_id;

                if ($purokId) {
                    // Get the purok boundary
                    $purok = Purok::find($purokId);

                    if ($purok) {
                        // Filter anomaly logs where IoT box is within the purok boundary
                        $query->whereHas('iotBox', function ($q) use ($purok) {
                            // Check devices with custom coordinates
                            $q->whereNotNull('custom_latitude')
                                ->whereNotNull('custom_longitude')
                                ->whereRaw(
                                    'ST_Contains((SELECT boundary FROM puroks WHERE id = ?), POINT(custom_longitude, custom_latitude))',
                                    [$purok->id]
                                );
                        });
                    }
                }
            }

            // Filter by anomaly type if provided
            if ($request->has('anomaly_type')) {
                $query->where('anomaly_type', $request->anomaly_type);
            }

            // Filter by confirmation status
            if ($request->has('is_confirmed')) {
                $query->where('is_confirmed', $request->boolean('is_confirmed'));
            }

            // Filter by IoT box ID
            if ($request->has('iot_box_id')) {
                $query->where('iot_box_id', $request->iot_box_id);
            }

            $anomalyLogs = $query->paginate($request->get('per_page', 15));

            return $this->sendResponse([
                'anomaly_logs' => $anomalyLogs,
            ], 'Anomaly logs retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving anomaly logs', [
                'error' => $e->getMessage(),
            ]);

            return $this->sendError('Failed to retrieve anomaly logs');
        }
    }

    /**
     * Get a specific anomaly log with related anomalies.
     */
    public function show(string $id)
    {
        try {
            $anomalyLog = AnomalyLog::with([
                'iotBox',
                'relatedAnomalies' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                },
                'parentAnomaly', // Include parent if this is a duplicate
            ])
                ->withCount('relatedAnomalies')
                ->find($id);

            if (! $anomalyLog) {
                return $this->sendNotFound('Anomaly log not found');
            }

            return $this->sendResponse([
                'anomaly_log' => $anomalyLog,
            ], 'Anomaly log retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving anomaly log', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);

            return $this->sendError('Failed to retrieve anomaly log');
        }
    }

    /**
     * Serve anomaly image directly (bypasses ngrok browser warning).
     */
    public function serveImage(string $id)
    {
        try {
            $anomalyLog = AnomalyLog::find($id);

            if (! $anomalyLog || ! $anomalyLog->image) {
                abort(404, 'Image not found');
            }

            $disk = Storage::disk($this->resolveStorageDisk());

            if (! $disk->exists($anomalyLog->image)) {
                abort(404, 'Image file not found');
            }

            $file = $disk->get($anomalyLog->image);
            $mimeType = $disk->mimeType($anomalyLog->image);

            return response($file, 200)
                ->header('Content-Type', $mimeType)
                ->header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

        } catch (\Exception $e) {
            Log::error('Error serving anomaly image', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);
            abort(500, 'Failed to serve image');
        }
    }

    /**
     * Confirm or update an anomaly log.
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'is_confirmed' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors());
        }

        DB::beginTransaction();

        try {
            $anomalyLog = AnomalyLog::find($id);

            if (! $anomalyLog) {
                return $this->sendNotFound('Anomaly log not found');
            }

            $anomalyLog->update($request->only(['is_confirmed']));

            Log::info('Anomaly log updated', [
                'anomaly_log_id' => $anomalyLog->id,
                'is_confirmed' => $anomalyLog->is_confirmed,
                'updated_by' => auth()->id(),
            ]);

            DB::commit();

            return $this->sendResponse([
                'anomaly_log' => $anomalyLog->fresh('iotBox'),
            ], 'Anomaly log updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error updating anomaly log', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);

            return $this->sendError('Failed to update anomaly log');
        }
    }

    /**
     * Manually merge anomaly logs (mark one as duplicate of another).
     * Similar to how concerns can be merged.
     */
    public function mergeAnomalies(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'parent_anomaly_id' => 'required|integer|exists:anomaly_logs,id',
            'child_anomaly_ids' => 'required|array|min:1',
            'child_anomaly_ids.*' => 'integer|exists:anomaly_logs,id',
        ], [
            'parent_anomaly_id.required' => 'Parent anomaly ID is required.',
            'parent_anomaly_id.exists' => 'Parent anomaly log not found.',
            'child_anomaly_ids.required' => 'At least one child anomaly ID is required.',
            'child_anomaly_ids.*.exists' => 'One or more child anomaly logs not found.',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors());
        }

        DB::beginTransaction();

        try {
            $parentAnomaly = AnomalyLog::find($request->parent_anomaly_id);

            // Ensure parent is not itself a duplicate
            if ($parentAnomaly->is_duplicate) {
                return $this->sendError('Cannot merge into a duplicate anomaly. Use the parent anomaly instead.');
            }

            $childIds = $request->child_anomaly_ids;

            // Filter out the parent ID if accidentally included
            $childIds = array_filter($childIds, fn ($id) => $id != $parentAnomaly->id);

            if (empty($childIds)) {
                return $this->sendError('No valid child anomalies to merge.');
            }

            // Update all children to point to the parent
            AnomalyLog::whereIn('id', $childIds)
                ->update([
                    'parent_anomaly_id' => $parentAnomaly->id,
                    'is_duplicate' => true,
                ]);

            // If any child was a parent with its own children, reassign those children
            AnomalyLog::whereIn('parent_anomaly_id', $childIds)
                ->update([
                    'parent_anomaly_id' => $parentAnomaly->id,
                ]);

            Log::info('Anomaly logs merged manually', [
                'parent_anomaly_id' => $parentAnomaly->id,
                'merged_child_ids' => $childIds,
                'merged_by' => auth()->id(),
            ]);

            DB::commit();

            return $this->sendResponse([
                'parent_anomaly' => $parentAnomaly->fresh(['iotBox', 'relatedAnomalies']),
                'merged_count' => count($childIds),
            ], 'Anomaly logs merged successfully');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error merging anomaly logs', [
                'error' => $e->getMessage(),
            ]);

            return $this->sendError('Failed to merge anomaly logs: '.$e->getMessage());
        }
    }

    /**
     * Unmerge (separate) a duplicate anomaly from its parent.
     */
    public function unmergeAnomaly(string $id)
    {
        DB::beginTransaction();

        try {
            $anomalyLog = AnomalyLog::find($id);

            if (! $anomalyLog) {
                return $this->sendNotFound('Anomaly log not found');
            }

            if (! $anomalyLog->is_duplicate) {
                return $this->sendError('This anomaly is not a duplicate and cannot be unmerged.');
            }

            $previousParentId = $anomalyLog->parent_anomaly_id;

            $anomalyLog->update([
                'parent_anomaly_id' => null,
                'is_duplicate' => false,
            ]);

            Log::info('Anomaly log unmerged', [
                'anomaly_log_id' => $anomalyLog->id,
                'previous_parent_id' => $previousParentId,
                'unmerged_by' => auth()->id(),
            ]);

            DB::commit();

            return $this->sendResponse([
                'anomaly_log' => $anomalyLog->fresh('iotBox'),
            ], 'Anomaly log unmerged successfully');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error unmerging anomaly log', [
                'error' => $e->getMessage(),
                'id' => $id,
            ]);

            return $this->sendError('Failed to unmerge anomaly log');
        }
    }

    /**
     * Verify if an IoT box is registered (for IoT box self-check).
     */
    public function verifyDevice(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->sendValidationError($validator->errors());
        }

        $token = $request->header('X-Device-Token');

        // Use service to verify and heartbeat
        $iotBox = $this->uwDeviceService->verifyAndHeartbeat($request->device_id, $token);

        if (! $iotBox) {
            // Check if device exists at all to give better error
            $exists = $this->uwDeviceService->getDeviceById($request->device_id);
            if (! $exists) {
                return $this->sendError('Device not registered', null, 404);
            }

            return $this->sendError('Invalid token or device inactive', null, 403);
        }

        return $this->sendResponse([
            'verified' => true,
            'device_name' => $iotBox->device_name,
            'status' => $iotBox->status,
        ], 'Device verified successfully');
    }

    /**
     * Get anomaly log statistics for dashboard.
     * For purok leaders, statistics are filtered by their assigned territory.
     */
    public function statistics(Request $request)
    {
        try {
            $user = auth()->user();
            $today = now()->startOfDay();
            $thisWeek = now()->startOfWeek();
            $thisMonth = now()->startOfMonth();

            // Build base query with territory filter for purok leaders
            $baseQueryCallback = function ($query) use ($user) {
                if ($user->role_id === 2) {
                    $purokId = $user->officialDetails?->purok_id;
                    if ($purokId) {
                        $purok = Purok::find($purokId);
                        if ($purok) {
                            $query->whereHas('iotBox', function ($q) use ($purok) {
                                $q->whereNotNull('custom_latitude')
                                    ->whereNotNull('custom_longitude')
                                    ->whereRaw(
                                        'ST_Contains((SELECT boundary FROM puroks WHERE id = ?), POINT(custom_longitude, custom_latitude))',
                                        [$purok->id]
                                    );
                            });
                        }
                    }
                }

                return $query;
            };

            // Build device query with territory filter for purok leaders
            $deviceQueryCallback = function ($query) use ($user) {
                if ($user->role_id === 2) {
                    $purokId = $user->officialDetails?->purok_id;
                    if ($purokId) {
                        $purok = Purok::find($purokId);
                        if ($purok) {
                            $query->whereNotNull('custom_latitude')
                                ->whereNotNull('custom_longitude')
                                ->whereRaw(
                                    'ST_Contains((SELECT boundary FROM puroks WHERE id = ?), POINT(custom_longitude, custom_latitude))',
                                    [$purok->id]
                                );
                        }
                    }
                }

                return $query;
            };

            // Get purok info for response
            $purokInfo = null;
            if ($user->role_id === 2 && $user->officialDetails?->purok_id) {
                $purok = Purok::find($user->officialDetails->purok_id);
                if ($purok) {
                    $purokInfo = [
                        'id' => $purok->id,
                        'name' => $purok->name,
                    ];
                }
            }

            // Overall statistics with territory filter
            $stats = [
                'purok' => $purokInfo,
                'total' => [
                    'all_time' => $baseQueryCallback(AnomalyLog::query())->count(),
                    'today' => $baseQueryCallback(AnomalyLog::where('created_at', '>=', $today))->count(),
                    'this_week' => $baseQueryCallback(AnomalyLog::where('created_at', '>=', $thisWeek))->count(),
                    'this_month' => $baseQueryCallback(AnomalyLog::where('created_at', '>=', $thisMonth))->count(),
                ],
                'by_status' => [
                    'pending' => $baseQueryCallback(AnomalyLog::where('is_confirmed', false))->count(),
                    'confirmed' => $baseQueryCallback(AnomalyLog::where('is_confirmed', true))->count(),
                ],
                'by_type' => [
                    'sound_anomaly' => $baseQueryCallback(AnomalyLog::where('anomaly_type', 'sound_anomaly'))->count(),
                    'anti_tampering' => $baseQueryCallback(AnomalyLog::where('anomaly_type', 'anti_tampering'))->count(),
                ],
                'today_by_type' => [
                    'sound_anomaly' => $baseQueryCallback(AnomalyLog::where('anomaly_type', 'sound_anomaly')
                        ->where('created_at', '>=', $today))->count(),
                    'anti_tampering' => $baseQueryCallback(AnomalyLog::where('anomaly_type', 'anti_tampering')
                        ->where('created_at', '>=', $today))->count(),
                ],
                'devices' => [
                    'total' => $deviceQueryCallback(UwDevice::query())->count(),
                    'active' => $deviceQueryCallback(UwDevice::where('status', 'active'))->count(),
                    'online' => $deviceQueryCallback(UwDevice::where('last_seen_at', '>=', now()->subMinutes(5)))->count(),
                ],
                'recent_anomalies' => $baseQueryCallback(AnomalyLog::with('iotBox'))
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get()
                    ->map(function ($log) {
                        return [
                            'id' => $log->id,
                            'anomaly_type' => $log->anomaly_type,
                            'anomaly_type_label' => $this->getAnomalyTypeLabel($log->anomaly_type),
                            'device_name' => $log->iotBox?->device_name ?? 'Unknown',
                            'location' => $log->iotBox?->display_location ?? 'Unknown',
                            'is_confirmed' => $log->is_confirmed,
                            'created_at' => $log->created_at->toISOString(),
                            'time_ago' => $log->created_at->diffForHumans(),
                        ];
                    }),
            ];

            return $this->sendResponse($stats, 'Anomaly statistics retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving anomaly statistics', [
                'error' => $e->getMessage(),
            ]);

            return $this->sendError('Failed to retrieve anomaly statistics');
        }
    }

    /**
     * Get human-readable label for anomaly type.
     */
    private function getAnomalyTypeLabel(string $type): string
    {
        return match ($type) {
            'sound_anomaly' => 'Sound Anomaly',
            'anti_tampering' => 'Anti-Tampering Alert',
            default => ucfirst(str_replace('_', ' ', $type)),
        };
    }

    /**
     * Resolve upload disk similar to FileUploadService behavior.
     */
    private function resolveStorageDisk(): string
    {
        $disk = config('filesystems.default');

        if ($disk === 's3' && empty(config('filesystems.disks.s3.bucket'))) {
            return 'public';
        }

        if ($disk === 'local') {
            return 'public';
        }

        return $disk;
    }
}
