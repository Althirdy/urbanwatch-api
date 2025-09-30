<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\CCTVRequest;
use App\Models\cctvDevices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class CCTVController extends Controller
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
                'location_id' => $cctvDevice->location_id
            ]);

            // Commit the transaction
            DB::commit();

            return redirect()->back()->with('success', 'CCTV device created successfully!');
        } catch (\Exception $e) {
            // Rollback the transaction on error
            DB::rollBack();

            // Log the error with details
            Log::error('CCTV Creation Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'validated_data' => $validated ?? 'No validated data'
            ]);

            return redirect()->back()
                ->with('error', 'An error occurred while creating the CCTV device: ' . $e->getMessage())
                ->withInput();
        }
    }
}
