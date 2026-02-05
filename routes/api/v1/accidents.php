<?php

use App\Http\Controllers\Api\V1\ActiveAccidentController;
use App\Http\Controllers\Api\V1\Operator\AccidentController;
use Illuminate\Support\Facades\Route;

// Accident/Report Routes
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    Route::prefix('accidents')->group(function () {
        Route::get('/', [AccidentController::class, 'index']);
        Route::get('/{accident}', [AccidentController::class, 'show']);
        Route::patch('/{accident}/status', [AccidentController::class, 'updateStatus']);
    });

    // Active (In Progress) Accidents - Role-based access (Role 2: full data, Role 3: limited data)
    Route::prefix('active-accidents')->group(function () {
        Route::get('/list', [ActiveAccidentController::class, 'list']);
        Route::get('/', [ActiveAccidentController::class, 'index']);
        Route::get('/{id}', [ActiveAccidentController::class, 'show']);
    });
});
