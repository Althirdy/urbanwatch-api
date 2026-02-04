<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Operator\CCTVRequest;
use App\Http\Resources\Api\v1\CCTVResource;
use App\Models\cctvDevices;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CCTVController extends BaseApiController
{
    public function store(CCTVRequest $request)
    {
        // Start database transaction
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            // Log the validated data
            Log::info('CCTV Data to be created:', $validated);

            // Create the CCTV device
            $cctvDevice = cctvDevices::create($validated);

            // Log successful creation
            Log::info('CCTV Device created successfully:', [
                'id' => $cctvDevice->id,
                'device_name' => $cctvDevice->device_name,
                'location_id' => $cctvDevice->location_id,
            ]);

            // Commit the transaction
            DB::commit();

            return redirect()->back()->with('success', 'CCTV device created successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // Log the error with details
            Log::error('CCTV Creation Error: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'validated_data' => $validated ?? 'No validated data',
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while creating the CCTV device: '.$e->getMessage())
                ->withInput();
        }
    }

    public function getActiveCCTVs()
    {
        $cacheKey = 'cctv_devices_active';
        $cctvDevices = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addHours(1), function () {
            return cctvDevices::where('status', 'active')->get();
        });

        return $this->sendResponse(CCTVResource::collection($cctvDevices), 'Active CCTV devices retrieved successfully.');
    }

    /**
     * Get all CCTV devices that have YOLO detection enabled.
     * This endpoint is used by the Python YOLO script to fetch
     * which cameras should be processed for accident detection.
     */
    public function getYoloEnabledCCTVs()
    {
        $cacheKey = 'cctv_devices_yolo_active';
        $cctvDevices = \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addHours(1), function () {
            return cctvDevices::where('yolo_enabled', true)
                ->where('status', 'active')
                ->with('location:id,location_name,landmark,barangay')
                ->get();
        });

        return $this->sendResponse(CCTVResource::collection($cctvDevices), 'YOLO-enabled CCTV devices retrieved successfully.');
    }

    /**
     * Toggle the YOLO detection enabled status for a CCTV device.
     */
    public function toggleYolo(cctvDevices $cctv)
    {
        DB::beginTransaction();

        try {
            $cctv->yolo_enabled = ! $cctv->yolo_enabled;
            $cctv->save();

            DB::commit();

            Log::info('CCTV YOLO status toggled:', [
                'id' => $cctv->id,
                'device_name' => $cctv->device_name,
                'yolo_enabled' => $cctv->yolo_enabled,
            ]);

            $status = $cctv->yolo_enabled ? 'enabled' : 'disabled';

            return redirect()->back()->with('success', "YOLO detection {$status} for {$cctv->device_name}");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('CCTV YOLO Toggle Error: '.$e->getMessage(), [
                'cctv_id' => $cctv->id,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while toggling YOLO detection.');
        }
    }

    public function update(CCTVRequest $request, cctvDevices $cctv)
    {
        // Start database transaction
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            // Log the validated data
            Log::info('CCTV Data to be updated:', $validated);

            // Update the CCTV device
            $cctv->update($validated);

            // Log successful update
            Log::info('CCTV Device updated successfully:', [
                'id' => $cctv->id,
                'device_name' => $cctv->device_name,
                'location_id' => $cctv->location_id,
            ]);

            // Commit the transaction
            DB::commit();

            return redirect()->back()->with('success', 'CCTV device updated successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // Log the error with details
            Log::error('CCTV Update Error: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'validated_data' => $validated ?? 'No validated data',
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while updating the CCTV device: '.$e->getMessage())
                ->withInput();
        }
    }

    public function destroy(cctvDevices $cctv)
    {
        DB::beginTransaction();

        try {
            $cctv->delete();

            DB::commit();
            Log::info('CCTV Device deleted successfully:', [
                'id' => $cctv->id,
                'device_name' => $cctv->device_name,
                'location_id' => $cctv->location_id,
            ]);

            return redirect()->back()->with('success', 'CCTV device deleted successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('CCTV Deletion Error: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'cctv_id' => $cctv->id,
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while deleting the CCTV device.');
        }
    }
}
