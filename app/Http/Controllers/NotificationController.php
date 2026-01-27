<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Resources\Api\V1\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;

class NotificationController extends BaseApiController
{
    public function __construct(protected NotificationService $notificationService) {}

    private function getUserType(): string
    {
        $user = auth()->user();
        if ($user->role_id === 2) {
            return Notification::USER_TYPE_PUROK_LEADER;
        }
        return Notification::USER_TYPE_CITIZEN;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $userId = auth()->id();
            $userType = $this->getUserType();
            $perPage = min($request->input('per_page', 20), 30);

            $notifications = $this->notificationService->getUserNotifications(
                $userId,
                $userType,
                $perPage
            );

            $data = [
                'notifications' => NotificationResource::collection($notifications),
                'pagination' => [
                    'current_page' => $notifications->currentPage(),
                    'per_page' => $notifications->perPage(),
                    'total' => $notifications->total(),
                    'last_page' => $notifications->lastPage(),
                    'has_more' => $notifications->hasMorePages(),
                ],
            ];

            return $this->sendResponse($data, 'Notifications fetched successfully');
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return $this->sendError('Failed to fetch notifications', 500);
        }
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Notification $notification)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Notification $notification)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Notification $notification)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Notification $notification)
    {
        //
    }
}
