<?php

use App\Http\Controllers\Api\Auth\ApiLoginController;
use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [ApiLoginController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/citizen', [AuthController::class, 'register']);
Route::post('/verify-national-id', [AuthController::class, 'verifyNationalId']);
Route::post('/logout', [ApiLoginController::class, 'logout'])->middleware('auth:sanctum');

// Email verification routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/verify-email-code', [AuthController::class, 'verifyEmailCode']);
    Route::post('/resend-verification-code', [AuthController::class, 'resendVerificationCode']);
    Route::get('/check-email-verification', [AuthController::class, 'checkEmailVerification']);

    // Aliases to match mobile app endpoints
    Route::post('/email/verify-code', [AuthController::class, 'verifyEmailCode']);
    Route::post('/email/resend-code', [AuthController::class, 'resendVerificationCode']);
    Route::get('/email/check', [AuthController::class, 'checkEmailVerification']);
});



Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('user', [ApiLoginController::class, 'user']);
    });
});


Route::get('health', function () {
    return response()->json(['status' => 'OK'], 200);
});


require __DIR__ . '/Citizen/ConcernManagement.php';
