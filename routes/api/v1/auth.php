<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\OtpController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use Illuminate\Support\Facades\Route;

// ========OTP Routes (SMS-based)========//
Route::prefix('otp')->group(function () {
    Route::post('/request', [OtpController::class, 'requestOtp']);
    Route::post('/verify', [OtpController::class, 'verifyOtp']);
    Route::post('/resend', [OtpController::class, 'resendOtp']);
    Route::post('/test-sms', [OtpController::class, 'testSms']); // Test endpoint
});

// ========Auth Routes======== //
Route::prefix('auth')->group(function () {
    Route::post('/request_otp', [OtpController::class, 'registrationOtp']);
    Route::post('/password/reset', [PasswordResetController::class, 'reset']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/ocr', [AuthController::class, 'uploadNationalId'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login/purok_leader', [AuthController::class, 'loginPurokLeader']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Logout requires access token
    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware(['auth:sanctum', 'ability.access']);
    // Refresh token endpoint - only accepts refresh tokens
    Route::post('/refresh-token', [AuthController::class, 'refreshToken'])
        ->middleware('auth:sanctum');
});

// Protected routes - require access token
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('user', [AuthController::class, 'user']);
    });
});
