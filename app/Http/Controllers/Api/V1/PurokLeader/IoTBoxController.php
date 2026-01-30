<?php

namespace App\Http\Controllers\Api\V1\PurokLeader;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\AnomalyLog;
use App\Services\FileUploadService;
use App\Services\UwDeviceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class IoTBoxController extends BaseApiController
{
    protected FileUploadService $fileUploadService;

    protected UwDeviceService $uwDeviceService;

    public function __construct(FileUploadService $fileUploadService, UwDeviceService $uwDeviceService)
    {
        $this->fileUploadService = $fileUploadService;
        $this->uwDeviceService = $uwDeviceService;
    }

    /**
     * Receive anomaly data from registered IoT box.
     * The IoT box must be registered (have a matching device_id) before sending data.
     */
    public function storeAnomalyLog(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|integer',
            'anomaly_type' => 'required|in:sound_anomaly,anti_tampering',
            'image' => 'nullable|image|max:10240', // Max 10MB
            'details' => 'nullable|array',
        ], [
            'device_id.required' => 'Device ID is required.',
            'device_id.integer' => 'Device ID must be an integer.',
            'anomaly_type.required' => 'Anomaly type is required.',
            'anomaly_type.in' => 'Anomaly type must be sound_anomaly or anti_tampering.',
            'image.image' => 'The file must be an image.',
            'image.max' => 'Image must not exceed 10MB.',
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

            // use service to verify and update heartbeat
            $iotBox = $this->uwDeviceService->verifyAndHeartbeat($request->device_id, $token);

            if (! $iotBox) {
                Log::warning('Unregistered, inactive, or invalid token IoT box attempted to send data', [
                    'device_id' => $request->device_id,
                    'ip' => $request->ip(),
                ]);

                return $this->sendError('IoT box is not registered, inactive, or token is invalid.', null, 403);
            }

            // Handle image upload if provided
            $imagePath = null;
            if ($request->hasFile('image')) {
                $uploadResult = $this->fileUploadService->uploadSingle(
                    $request->file('image'),
                    'anomaly_logs'
                );
                $imagePath = $uploadResult['storage_path'];
            }

            // Create anomaly log
            $anomalyLog = AnomalyLog::create([
                'device_id' => $request->device_id, // Store the device_id sent by IoT box
                'iot_box_id' => $iotBox->id,
                'anomaly_type' => $request->anomaly_type,
                'image' => $imagePath,
                'details' => $request->details,
                'is_confirmed' => false,
            ]);

            Log::info('Anomaly log created from IoT box', [
                'anomaly_log_id' => $anomalyLog->id,
                'iot_box_id' => $iotBox->id,
                'device_id' => $request->device_id,
                'anomaly_type' => $request->anomaly_type,
            ]);

            DB::commit();

            return $this->sendResponse([
                'anomaly_log_id' => $anomalyLog->id,
                'iot_box' => [
                    'id' => $iotBox->id,
                    'device_name' => $iotBox->device_name,
                ],
                'anomaly_type' => $anomalyLog->anomaly_type,
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
     * Get all anomaly logs (for operators/purok leaders).
     */
    public function index(Request $request)
    {
        try {
            $query = AnomalyLog::with('iotBox')
                ->orderBy('created_at', 'desc');

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
     * Get a specific anomaly log.
     */
    public function show(string $id)
    {
        try {
            $anomalyLog = AnomalyLog::with('iotBox')->find($id);

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
     * Verify if an IoT box is registered (for IoT box self-check).
     */
    public function verifyDevice(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'device_id' => 'required|integer',
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
}
