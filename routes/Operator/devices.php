<?php

use App\Http\Controllers\Operator\CCTVController;
use App\Models\cctvDevices;
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

        return Inertia::render('devices', [
            'devices' => $cctvDevices,
            'locations' => $location
        ]);
    })->name('devices');

    Route::post('devices/cctv', [CCTVController::class, 'store'])->name('devices.cctv.store');
    Route::put('devices/cctv/{cctv}', [CCTVController::class, 'update'])->name('devices.cctv.update');
    Route::delete('devices/cctv/{cctv}', [CCTVController::class, 'destroy'])->name('devices.cctv.destroy');
});
