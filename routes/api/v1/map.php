<?php

use App\Http\Controllers\Api\V1\PurokLeader\MapAnomalyController;
use Illuminate\Support\Facades\Route;

/**
 * Map API Routes
 *
 * Barangay-wide map endpoints (no purok territory filtering).
 */
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    Route::get('/map/anomalies', [MapAnomalyController::class, 'index']);
});
