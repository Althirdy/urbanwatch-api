<?php

use App\Http\Controllers\NotificationController;
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
    Route::put('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    
    // PUT /api/v1/notifications/mark-all-read - Mark all as read
    Route::put('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    
    // DELETE /api/v1/notifications/{id} - Delete a notification
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
    
    // DELETE /api/v1/notifications/clear - Clear all notifications
    Route::delete('notifications/clear', [NotificationController::class, 'clearAll']);
});