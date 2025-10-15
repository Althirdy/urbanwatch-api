<?php

use App\Http\Controllers\Api\Citizen\ConcernController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('citizen')->group(function () {
        Route::post('manual-concern', [ConcernController::class, 'manualConcern']);
    });
});
