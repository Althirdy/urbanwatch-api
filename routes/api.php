<?php

use App\Http\Controllers\Api\Auth\ApiLoginController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [ApiLoginController::class, 'login']);
Route::post('/logout', [ApiLoginController::class, 'logout'])->middleware('auth:sanctum');



Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('user', [ApiLoginController::class, 'user']);
    });
});


Route::get('health', function () {
    return response()->json(['status' => 'OK'], 200);
});


Route::apiResource('yolo/accidents', App\Http\Controllers\Api\Yolo\AccidentController::class);

require __DIR__ . '/Citizen/ConcernManagement.php';
