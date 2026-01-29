<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\UWDeviceRequest;
use App\Models\UwDevice;
use App\Services\UwDeviceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UWDeviceController extends Controller
{
    protected $uwDeviceService;

    public function __construct(UwDeviceService $uwDeviceService)
    {
        $this->uwDeviceService = $uwDeviceService;
    }
    /**
     * Store a newly created UW device in storage.
     */
    public function store(UWDeviceRequest $request)
    {
        try {
            $validated = $request->validated();

            // Use service to create device
            $uwDevice = $this->uwDeviceService->createDevice($validated);

            return redirect()->back()->with([
                'success' => 'UW device created successfully!',
                'api_token' => $uwDevice->api_token, 
            ]);
        } catch (\Exception $e) {
            Log::error('UW Device Creation Error: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'validated_data' => $validated ?? 'No validated data',
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while creating the UW device: '.$e->getMessage())
                ->withInput();
        }
    }

    /**
     * Update the specified UW device in storage.
     */
    public function update(UWDeviceRequest $request, UwDevice $uwdevice)
    {
        try {
            $validated = $request->validated();

            // Use service to update device
            $this->uwDeviceService->updateDevice($uwdevice, $validated);

            return redirect()->back()->with('success', 'UW device updated successfully!');
        } catch (\Exception $e) {
            Log::error('UW Device Update Error: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'device_id' => $uwdevice->id,
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while updating the UW device: '.$e->getMessage())
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
                'device_name' => $uwdevice->device_name,
            ]);

            // Soft delete the UW device
            $uwdevice->delete();

            // Commit the transaction
            DB::commit();

            // Log successful deletion
            Log::info('UW Device deleted successfully:', [
                'id' => $uwdevice->id,
                'device_name' => $uwdevice->device_name,
            ]);

            return redirect()->back()->with('success', 'UW device deleted successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // Log the error with details
            Log::error('UW Device Deletion Error: '.$e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'device_id' => $uwdevice->id,
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while deleting the UW device: '.$e->getMessage());
        }
    }
}
