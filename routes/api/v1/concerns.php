<?php

use App\Http\Controllers\Api\V1\Citizen\ConcernController;
use App\Http\Controllers\Api\V1\PurokLeader\ConcernController as PurokLeaderConcernController;
use Illuminate\Support\Facades\Route;

// Citizen Concern Management Routes
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    // Citizen routes
    Route::middleware('role:citizen')->group(function () {
        Route::get('concerns/archived', [ConcernController::class, 'archived']);

        // Custom throttle for concern submission
        Route::post('concerns', [ConcernController::class, 'store'])->middleware('throttle:concerns.submit');

        // Citizen confirmation of resolution
        Route::post('concerns/{id}/confirm-resolution', [ConcernController::class, 'confirmResolution']);

        Route::apiResource('concerns', ConcernController::class)->except(['store']);
    });

    // Purok Leader routes
    Route::prefix('purok-leader')->middleware('role:2')->group(function () {
        Route::get('concerns', [PurokLeaderConcernController::class, 'index']);
        Route::get('concerns/{id}', [PurokLeaderConcernController::class, 'show']);
        Route::put('concerns/{id}/status', [PurokLeaderConcernController::class, 'update']);
    });
});
