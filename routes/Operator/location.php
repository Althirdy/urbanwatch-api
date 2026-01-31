<?php

use App\Http\Controllers\Operator\LocationController;
use App\Models\Locations;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('locations', function () {
        $locations = Locations::with([
            'cctvDevices:id,location_id',
        ])
            ->select('id', 'location_name', 'landmark', 'barangay', 'latitude', 'longitude', 'description')
            ->get();

        $locations->transform(function ($location) {
            $location->cctv_count = $location->cctvDevices->count();
            unset($location->cctvDevices);

            return $location;
        });

        $packages = \App\Models\Purok::select('id', 'name')->get();

        return Inertia::render('locations', [
            'locations' => $locations,
            'packages' => $packages,
        ]);
    })->name('locations');

    Route::post('locations', [LocationController::class, 'store'])->name('locations.store');
    Route::put('locations/{location}', [LocationController::class, 'update'])->name('locations.update');
    Route::delete('locations/{location}', [LocationController::class, 'destroy'])->name('locations.destroy');
});
