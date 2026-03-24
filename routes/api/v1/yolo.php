<?php

use App\Http\Controllers\Api\V1\Yolo\YoloAccidentController;
use App\Http\Controllers\Operator\CCTVController;
use Illuminate\Support\Facades\Route;

// YOLO Detection Routes (protected with API key - called by Python YOLO script)
Route::middleware('api.key')->group(function () {
    Route::post('yolo/process-snapshot', [YoloAccidentController::class, 'ProcessSnapShot'])
        ->middleware('throttle:yolo.ingest');
    Route::get('yolo/enabled-cctvs', [CCTVController::class, 'getYoloEnabledCCTVs']);
});

// False Alarm Monitoring Routes (protected with Sanctum - accessed by authenticated operators)
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    Route::get('yolo/false-alarms/stats', [YoloAccidentController::class, 'getFalseAlarmStats']);
    Route::get('yolo/false-alarms', [YoloAccidentController::class, 'getFalseAlarms']);
});

Route::get('yolo/active-cctvs', [CCTVController::class, 'getActiveCCTVs']);
