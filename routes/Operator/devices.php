<?php

use App\Http\Controllers\Operator\CCTVController;
use App\Http\Controllers\Operator\UWDeviceController;
use App\Models\cctvDevices;
use App\Models\UwDevice;
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

        // Get UW Devices with relationships
        $uwDevices = UwDevice::with([
            'location:id,location_name,landmark,barangay,location_category',
            'location.locationCategory:id,name',
            'cctvDevice:id,device_name,location_id'
        ])->paginate(10);

        $uwDevices->getCollection()->transform(function ($device) {
            if ($device->location && $device->location->locationCategory) {
                $device->location->category_name = $device->location->locationCategory->name;
            }
            
            // Add helper properties for frontend
            if ($device->cctvDevice) {
                $device->cctv_cameras = [$device->cctvDevice];
            } else {
                $device->cctv_cameras = [];
            }
            
            // Add latitude/longitude helpers (from location or custom)
            if ($device->location) {
                $device->latitude = $device->location->latitude ?? null;
                $device->longitude = $device->location->longitude ?? null;
            } else {
                $device->latitude = $device->custom_latitude;
                $device->longitude = $device->custom_longitude;
            }
            
            return $device;
        });

        // Get all CCTV devices for the dropdown in UW Device form
        $allCctvDevices = cctvDevices::with('location:id,location_name')->get();

        return Inertia::render('devices', [
            'devices' => $cctvDevices,
            'uwDevices' => $uwDevices,
            'locations' => $location,
            'cctvDevices' => $allCctvDevices
        ]);
    })->name('devices');

    // CCTV Routes
    Route::post('devices/cctv', [CCTVController::class, 'store'])->name('devices.cctv.store');
    Route::put('devices/cctv/{cctv}', [CCTVController::class, 'update'])->name('devices.cctv.update');
    Route::delete('devices/cctv/{cctv}', [CCTVController::class, 'destroy'])->name('devices.cctv.destroy');

    // UW Device Routes
    Route::post('devices/uwdevice', [UWDeviceController::class, 'store'])->name('devices.uwdevice.store');
    Route::put('devices/uwdevice/{uwdevice}', [UWDeviceController::class, 'update'])->name('devices.uwdevice.update');
    Route::delete('devices/uwdevice/{uwdevice}', [UWDeviceController::class, 'destroy'])->name('devices.uwdevice.destroy');
});
