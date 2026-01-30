<?php

use App\Http\Controllers\Operator\CCTVController;
use App\Http\Controllers\Operator\UWDeviceController;
use App\Models\cctvDevices;
use App\Models\Locations;
use App\Models\UwDevice;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('devices', function () {

        $location = Locations::get()->map(function ($loc) {
            return [
                'id' => $loc->id,
                'location_name' => $loc->location_name,
                'landmark' => $loc->landmark,
                'barangay' => $loc->barangay,
            ];
        });

        $cctvDevices = cctvDevices::with([
            'location:id,location_name,landmark,barangay',
        ])->paginate(10);

        // Get UW Devices with relationships
        $uwDevices = UwDevice::with([
            'location:id,location_name,landmark,barangay,latitude,longitude',
            'location.cctvDevices:id,device_name,location_id',
        ])->paginate(10);

        $uwDevices->getCollection()->transform(function ($device) {
            // Add helper properties for frontend
            // Since cctv_id was removed from uw_devices, we get cameras sharing the same location
            $device->cctv_cameras = $device->location ? $device->location->cctvDevices : [];

            return $device;
        });

        // Get all CCTV devices for the dropdown in UW Device form
        $allCctvDevices = cctvDevices::with('location:id,location_name')->get();

        return Inertia::render('devices', [
            'devices' => $cctvDevices,
            'uwDevices' => $uwDevices,
            'locations' => $location,
            'cctvDevices' => $allCctvDevices,
        ]);
    })->name('devices');

    // CCTV Routes
    Route::post('devices/cctv', [CCTVController::class, 'store'])->name('devices.cctv.store');
    Route::put('devices/cctv/{cctv}', [CCTVController::class, 'update'])->name('devices.cctv.update');
    Route::delete('devices/cctv/{cctv}', [CCTVController::class, 'destroy'])->name('devices.cctv.destroy');
    Route::patch('devices/cctv/{cctv}/toggle-yolo', [CCTVController::class, 'toggleYolo'])->name('devices.cctv.toggle-yolo');

    // UW Device Routes
    Route::post('devices/uwdevice', [UWDeviceController::class, 'store'])->name('devices.uwdevice.store');
    Route::put('devices/uwdevice/{uwdevice}', [UWDeviceController::class, 'update'])->name('devices.uwdevice.update');
    Route::delete('devices/uwdevice/{uwdevice}', [UWDeviceController::class, 'destroy'])->name('devices.uwdevice.destroy');
});
