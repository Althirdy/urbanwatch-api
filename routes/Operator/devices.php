<?php

use App\Http\Controllers\Operator\CCTVController;
use App\Http\Controllers\UWDeviceController;
use App\Models\cctvDevices;
use App\Models\UWDevice;
use App\Models\Locations;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('devices', function () {

        $location = Locations::with('locationCategory:id,name')->get()->map(function ($loc) {
            return [
                'id' => $loc->id,
                'location_name' => $loc->location_name,
                'landmark' => $loc->landmark,
                'barangay' => $loc->barangay,
                'category_name' => $loc->locationCategory?->name,
            ];
        });

        $cctvDevices = cctvDevices::with([
            'location:id,location_name,landmark,barangay,location_category',
            'location.locationCategory:id,name'
        ])->paginate(10);

        $cctvDevices->getCollection()->transform(function ($device) {
            if ($device->location && $device->location->locationCategory) {
                $device->location->category_name = $device->location->locationCategory->name;
            }
            return $device;
        });

        // Fetch UW devices with basic relationships (simplified to match CCTV pattern)
        $uwDevices = UWDevice::with([
            'location:id,location_name,landmark,barangay,location_category',
            'location.locationCategory:id,name'
        ])->paginate(10);

        $uwDevices->getCollection()->transform(function ($device) {
            if ($device->location && $device->location->locationCategory) {
                $device->location->category_name = $device->location->locationCategory->name;
            }
            // No need to transform status - it's already stored correctly as string
            
            return $device;
        });

        return Inertia::render('devices', [
            'devices' => $cctvDevices,
            'uwDevices' => $uwDevices,
            'locations' => $location
        ]);
    })->name('devices');

    Route::post('devices/cctv', [CCTVController::class, 'store'])->name('devices.cctv.store');
    Route::put('devices/cctv/{cctv}', [CCTVController::class, 'update'])->name('devices.cctv.update');
    Route::delete('devices/cctv/{cctv}', [CCTVController::class, 'destroy'])->name('devices.cctv.destroy');

    // UW Device routes
    Route::post('devices/uw', [UWDeviceController::class, 'store'])->name('devices.uw.store');
    Route::put('devices/uw/{uwDevice}', [UWDeviceController::class, 'update'])->name('devices.uw.update');
    Route::delete('devices/uw/{uwDevice}', [UWDeviceController::class, 'destroy'])->name('devices.uw.destroy');
    Route::get('devices/uw/{uwDevice}', [UWDeviceController::class, 'show'])->name('devices.uw.show');
    Route::get('api/cctv-cameras', [UWDeviceController::class, 'getAvailableCameras'])->name('api.cctv.cameras');
});
