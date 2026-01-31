<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends BaseApiController
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Get the user type based on the authenticated user's role.
     */
    private function getUserType(): string
    {
        $user = auth()->user();
        
        // Role ID 2 = Purok Leader
        if ($user->role_id === 2) {
            return Notification::USER_TYPE_PUROK_LEADER;
        }
        
        // Default to citizen
        return Notification::USER_TYPE_CITIZEN;
    }

    /**
     * Get paginated notifications for the authenticated user.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $userId = auth()->id();
            $userType = $this->getUserType();
            $perPage = min($request->input('per_page', 20), 50); // Max 50 per page

            $notifications = $this->notificationService->getUserNotifications(
                $userId,
                $userType,
                $perPage
            );

            return $this->sendResponse([
                'notifications' => $notifications->items(),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'last_page' => $notifications->lastPage(),
                    'has_more' => $notifications->hasMorePages(),
                ],
            ], 'Notifications retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving notifications', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return $this->sendError('Failed to retrieve notifications');
        }
    }

    /**
     * Get the unread notification count for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function unreadCount()
    {
        try {
            $userId = auth()->id();
            $userType = $this->getUserType();

            $count = $this->notificationService->getUnreadCount($userId, $userType);

            return $this->sendResponse([
                'unread_count' => $count,
            ], 'Unread count retrieved successfully');

        } catch (\Exception $e) {
            Log::error('Error retrieving unread count', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return $this->sendError('Failed to retrieve unread count');
        }
    }

    /**
     * Mark a specific notification as read.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(int $id)
    {
        try {
            $userId = auth()->id();
            
            $success = $this->notificationService->markAsRead($id, $userId);

            if (!$success) {
                return $this->sendError('Notification not found', [], 404);
            }

            return $this->sendResponse([
                'notification_id' => $id,
            ], 'Notification marked as read');

        } catch (\Exception $e) {
            Log::error('Error marking notification as read', [
                'error' => $e->getMessage(),
                'notification_id' => $id,
            ]);

            return $this->sendError('Failed to mark notification as read');
        }
    }

    /**
     * Mark all notifications as read for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead()
    {
        try {
            $userId = auth()->id();
            $userType = $this->getUserType();

            $count = $this->notificationService->markAllAsRead($userId, $userType);

            return $this->sendResponse([
                'marked_count' => $count,
            ], 'All notifications marked as read');

        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return $this->sendError('Failed to mark all notifications as read');
        }
    }

    /**
     * Delete a specific notification.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(int $id)
    {
        try {
            $userId = auth()->id();
            
            $success = $this->notificationService->deleteNotification($id, $userId);

            if (!$success) {
                return $this->sendError('Notification not found', [], 404);
            }

            return $this->sendResponse([
                'notification_id' => $id,
            ], 'Notification deleted successfully');

        } catch (\Exception $e) {
            Log::error('Error deleting notification', [
                'error' => $e->getMessage(),
                'notification_id' => $id,
            ]);

            return $this->sendError('Failed to delete notification');
        }
    }

    /**
     * Clear all notifications for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearAll()
    {
        try {
            $userId = auth()->id();
            $userType = $this->getUserType();

            $count = $this->notificationService->clearAllNotifications($userId, $userType);

            return $this->sendResponse([
                'deleted_count' => $count,
            ], 'All notifications cleared');

        } catch (\Exception $e) {
            Log::error('Error clearing all notifications', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return $this->sendError('Failed to clear notifications');
        }
    }
}
