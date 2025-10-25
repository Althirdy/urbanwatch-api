<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\UWDeviceRequest;
use App\Models\UwDevice;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class UWDeviceController extends Controller
{
    /**
     * Store a newly created UW device in storage.
     */
    public function store(UWDeviceRequest $request)
    {
        // Start database transaction
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            // Log the validated data
            Log::info('UW Device Data to be created:', $validated);

            // Create the UW device
            $uwDevice = UwDevice::create($validated);

            // Log successful creation
            Log::info('UW Device created successfully:', [
                'id' => $uwDevice->id,
                'device_name' => $uwDevice->device_name,
                'location_id' => $uwDevice->location_id,
                'cctv_id' => $uwDevice->cctv_id,
                'status' => $uwDevice->status
            ]);

            // Commit the transaction
            DB::commit();

            return redirect()->back()->with('success', 'UW device created successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // Log the error with details
            Log::error('UW Device Creation Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'validated_data' => $validated ?? 'No validated data'
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while creating the UW device: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Update the specified UW device in storage.
     */
    public function update(UWDeviceRequest $request, UwDevice $uwdevice)
    {
        // Start database transaction
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            // Log the validated data
            Log::info('UW Device Data to be updated:', [
                'device_id' => $uwdevice->id,
                'validated_data' => $validated
            ]);

            // Update the UW device
            $uwdevice->update($validated);

            // Log successful update
            Log::info('UW Device updated successfully:', [
                'id' => $uwdevice->id,
                'device_name' => $uwdevice->device_name,
                'location_id' => $uwdevice->location_id,
                'cctv_id' => $uwdevice->cctv_id,
                'status' => $uwdevice->status
            ]);

            // Commit the transaction
            DB::commit();

            return redirect()->back()->with('success', 'UW device updated successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // Log the error with details
            Log::error('UW Device Update Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'device_id' => $uwdevice->id,
                'validated_data' => $validated ?? 'No validated data'
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while updating the UW device: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove the specified UW device from storage (soft delete).
     */
    public function destroy(UwDevice $uwdevice)
    {
        // Start database transaction
        DB::beginTransaction();

        try {
            // Log the deletion attempt
            Log::info('Attempting to delete UW Device:', [
                'id' => $uwdevice->id,
                'device_name' => $uwdevice->device_name
            ]);

            // Soft delete the UW device
            $uwdevice->delete();

            // Commit the transaction
            DB::commit();

            // Log successful deletion
            Log::info('UW Device deleted successfully:', [
                'id' => $uwdevice->id,
                'device_name' => $uwdevice->device_name
            ]);

            return redirect()->back()->with('success', 'UW device deleted successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // Log the error with details
            Log::error('UW Device Deletion Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'device_id' => $uwdevice->id
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while deleting the UW device: ' . $e->getMessage());
        }
    }
}
