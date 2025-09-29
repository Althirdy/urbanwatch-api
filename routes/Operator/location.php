<?php

use App\Http\Controllers\Operator\LocationController;
use App\Models\LocationCategory;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('locations', function () {
        $locationCategory = LocationCategory::all();
        return Inertia::render('locations', [
            'locationCategories' => $locationCategory
        ]);
    })->name('locations');

    Route::post('locations', [LocationController::class, 'store'])->name('locations.store');
});
