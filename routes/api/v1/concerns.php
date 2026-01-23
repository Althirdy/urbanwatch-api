<?php

use App\Http\Controllers\Api\PurokLeader\ConcernController as PurokLeaderConcernController;
use App\Http\Controllers\Api\V1\Citizen\ConcernController;
use Illuminate\Support\Facades\Route;

// Citizen Concern Management Routes
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    // Citizen routes
    Route::get('concerns/archived', [ConcernController::class, 'archived']);
    Route::apiResource('concerns', ConcernController::class);

    // Purok Leader routes
    Route::prefix('purok-leader')->middleware('role:2')->group(function () {
        Route::get('concerns', [PurokLeaderConcernController::class, 'index']);
        Route::get('concerns/{id}', [PurokLeaderConcernController::class, 'show']);
        Route::put('concerns/{id}/status', [PurokLeaderConcernController::class, 'update']);
    });
});
