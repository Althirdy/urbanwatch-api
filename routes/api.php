<?php

use Illuminate\Support\Facades\Route;

/**
 * API Version 1 Routes
 * Base URL: /api/v1
 */
Route::prefix('v1')->group(function () {
    // Auth & OTP routes
    require __DIR__.'/api/v1/auth.php';

    // Citizen concern management routes
    require __DIR__.'/api/v1/concerns.php';

    // Contact management routes
    require __DIR__.'/api/v1/contacts.php';

    // Accident/Report routes
    require __DIR__.'/api/v1/accidents.php';

    // YOLO detection routes
    require __DIR__.'/api/v1/yolo.php';

    // Notifcation routes
    require __DIR__.'/api/v1/notifications.php';
    // IoT Box routes
    require __DIR__.'/api/v1/iotbox.php';

    // Public Post routes
    Route::get('/mobile/public-posts', [App\Http\Controllers\Operator\PublicPostController::class, 'getMobilePublicPosts'])
        ->middleware('auth:sanctum');

});

/**
 * Health Check Endpoint
 */
Route::get('health', function () {
    return response()->json([
        'status' => 'OK',
        'version' => 'v1',
        'timestamp' => now()->toISOString(),
    ], 200);
});
