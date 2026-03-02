<?php

use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PushTokenController;
use Illuminate\Support\Facades\Route;

/**
 * Notification Management Routes
 *
 * All routes require authentication via Sanctum.
 * Works for both Citizen and Purok Leader apps.
 */
Route::middleware(['auth:sanctum'])->group(function () {
    // GET /api/v1/notifications - Fetch paginated notifications
    Route::get('notifications', [NotificationController::class, 'index']);

    // GET /api/v1/notifications/unread-count - Get unread count
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);

    // PUT /api/v1/notifications/{id}/read - Mark as read
    Route::put('notifications/{id}/read', [NotificationController::class, 'markAsRead'])
        ->whereNumber('id');

    // PUT /api/v1/notifications/mark-all-read - Mark all as read
    Route::put('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // DELETE /api/v1/notifications/clear - Clear all notifications
    // NOTE: This MUST come BEFORE the {id} wildcard route
    Route::delete('notifications/clear', [NotificationController::class, 'clearAll']);

    // DELETE /api/v1/notifications/{id} - Delete a notification
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy'])
        ->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {
    // POST /api/v1/notifications/push-token - Register/upsert a device token
    Route::post('notifications/push-token', [PushTokenController::class, 'register']);

    // DELETE /api/v1/notifications/push-token - Deactivate a device token
    Route::delete('notifications/push-token', [PushTokenController::class, 'unregister']);
});
