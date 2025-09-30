<?php

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

        return Inertia::render('devices', [
            'devices' => [],
            'locations' => $location
        ]);
    })->name('devices');
});
