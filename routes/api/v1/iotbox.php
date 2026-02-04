<?php

use App\Http\Controllers\Api\V1\PurokLeader\IoTBoxController;
use Illuminate\Support\Facades\Route;

/**
 * IoT Box API Routes
 *
 * These routes handle IoT box device communication and anomaly log management.
 */

// Public routes for IoT box devices (no auth required)
Route::prefix('iot-box')->group(function () {
    // IoT box sends anomaly data (device must be registered)
    Route::post('anomaly', [IoTBoxController::class, 'storeAnomalyLog']);

    // IoT box verifies if it's registered
    Route::post('verify', [IoTBoxController::class, 'verifyDevice']);
});

// Authenticated routes for operators/purok leaders
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    Route::prefix('anomaly-logs')->group(function () {
        Route::get('/statistics', [IoTBoxController::class, 'statistics']);
        Route::get('/', [IoTBoxController::class, 'index']);
        Route::get('/{id}', [IoTBoxController::class, 'show']);
        Route::put('/{id}', [IoTBoxController::class, 'update']);
    });
});
