<?php

use App\Http\Controllers\Operator\LocationController;
use App\Models\LocationCategory;
use App\Models\Locations;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('locations', function () {
        $locationCategory = LocationCategory::select('id', 'name')->get();
        $locations = Locations::with('locationCategory:id,name')
            ->select('id', 'location_category', 'location_name', 'landmark', 'barangay', 'latitude', 'longitude', 'description')
            ->paginate(10);


        return Inertia::render('locations', [
            'locationCategories' => $locationCategory,
            'locations' => $locations
        ]);
    })->name('locations');

    Route::post('locations', [LocationController::class, 'store'])->name('locations.store');
    Route::put('locations/{location}', [LocationController::class, 'update'])->name('locations.update');
    Route::delete('locations/{location}', [LocationController::class, 'destroy'])->name('locations.destroy');
});
