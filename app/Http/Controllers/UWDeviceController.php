<?php

namespace App\Http\Controllers;

use App\Models\UWDevice;
use App\Models\Locations;
use App\Models\cctvDevices;
use App\Http\Requests\UWDeviceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class UWDeviceController extends Controller
{
    /**
     * Display a listing of the UW devices.
     */
    public function index(Request $request)
    {
        $query = UWDevice::with(['location', 'cctvCamera']);

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('device_name', 'like', "%{$search}%")
                  ->orWhere('custom_address', 'like', "%{$search}%")
                  ->orWhereHas('location', function ($locationQuery) use ($search) {
                      $locationQuery->where('location_name', 'like', "%{$search}%")
                                   ->orWhere('barangay', 'like', "%{$search}%")
                                   ->orWhere('landmark', 'like', "%{$search}%");
                  });
            });
        }

        // Status filter - simplified to match CCTV pattern
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        $devices = $query->paginate(10)->withQueryString();

        $locations = Locations::all();
        $cctvDevices = cctvDevices::with('location')->get(); // Show all cameras regardless of status

        return Inertia::render('devices', [
            'uwDevices' => $devices,
            'locations' => $locations,
            'cctvDevices' => $cctvDevices,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created UW device in storage.
     */
    public function store(UWDeviceRequest $request)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            // Create the UW device - simplified to match CCTV pattern
            $uwDevice = UWDevice::create($validated);

            DB::commit();

            return redirect()->back()->with('success', 'IoT device created successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create IoT device. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Display the specified UW device.
     */
    public function show(UWDevice $uwDevice)
    {
        $uwDevice->load(['location', 'cctvCamera']);
        
        return Inertia::render('UWDeviceDetails', [
            'uwDevice' => $uwDevice,
        ]);
    }

    /**
     * Update the specified UW device in storage.
     */
    public function update(UWDeviceRequest $request, UWDevice $uwDevice)
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            // Update the UW device - simplified to match CCTV pattern
            $uwDevice->update($validated);

            DB::commit();

            return redirect()->back()->with('success', 'IoT device updated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update IoT device. Please try again.'])
                ->withInput();
        }
    }

    /**
     * Remove the specified UW device from storage (soft delete).
     */
    public function destroy(UWDevice $uwDevice)
    {
        DB::beginTransaction();

        try {
            // Soft delete the UW device (no need to detach cameras as it's now a foreign key)
            $uwDevice->delete();

            DB::commit();

            return redirect()->back()->with('success', 'IoT device archived successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to archive IoT device. Please try again.']);
        }
    }

    /**
     * Get available CCTV cameras for linking.
     */
    public function getAvailableCameras(Request $request)
    {
        $cameras = cctvDevices::with('location')
            ->get() // Show all cameras regardless of status
            ->map(function ($camera) {
                return [
                    'id' => $camera->id,
                    'device_name' => $camera->device_name,
                    'location' => $camera->location ? $camera->location->location_name : 'Unknown',
                    'status' => $camera->status,
                ];
            });

        return response()->json($cameras);
    }
}