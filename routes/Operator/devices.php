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

        $cctvDevices = cctvDevices::with('location:id,location_name,landmark,barangay')->paginate(10);

        
        return Inertia::render('devices', [
            'devices' => $cctvDevices,
            'locations' => $location
        ]);
    })->name('devices');

    Route::post('devices/cctv', [CCTVController::class, 'store'])->name('devices.cctv.store');
});
