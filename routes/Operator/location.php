<?php

use App\Http\Controllers\Operator\LocationController;
use App\Models\LocationCategory;
use App\Models\Locations;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('locations', function () {
        $locationCategory = LocationCategory::select('id', 'name')->get();
        
        // Get unique barangays from locations
        $barangays = Locations::select('barangay')
            ->distinct()
            ->orderBy('barangay')
            ->get()
            ->map(function ($location, $index) {
                return [
                    'id' => $index + 1,
                    'name' => $location->barangay
                ];
            })
            ->values();
        // $locations = Locations::with('locationCategory:id,name')
        //     ->withCount('cctvDevices')
        //     ->select('id', 'location_category', 'location_name', 'landmark', 'barangay', 'latitude', 'longitude', 'description')
        //     ->paginate(10);

        $locations = Locations::with([
            'locationCategory:id,name',
            'cctvDevices:id,location_id' // Load the devices to count them
        ])
            ->select('id', 'location_category', 'location_name', 'landmark', 'barangay', 'latitude', 'longitude', 'description')
            ->paginate(10);

        $locations->getCollection()->transform(function ($location) {
            $location->cctv_count = $location->cctvDevices->count(); // Manual count
            unset($location->cctvDevices); // Remove the actual devices array to keep only the count
            return $location;
        });

        return Inertia::render('locations', [
            'locationCategories' => $locationCategory,
            'locations' => $locations,
            'barangays' => $barangays
        ]);
    })->name('locations');

    Route::post('location', [LocationController::class, 'store'])->name('locations.store');
    Route::put('location/{location}', [LocationController::class, 'update'])->name('locations.update');
    Route::delete('location/{location}', [LocationController::class, 'destroy'])->name('locations.destroy');
});
