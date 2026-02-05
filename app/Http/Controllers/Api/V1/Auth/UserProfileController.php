<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Exceptions\UrbanWatchException;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Citizen\ChangePasswordRequest;
use App\Services\FileUploadService;
use App\Services\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class UserProfileController extends BaseApiController
{
    protected $userProfileService;

    protected $fileUploadService;

    public function __construct(UserProfileService $userProfileService, FileUploadService $fileUploadService)
    {
        $this->userProfileService = $userProfileService;
        $this->fileUploadService = $fileUploadService;
    }

    /**
     * Request OTP for sensitive profile update (Email/Phone).
     */
    public function requestUpdateOtp(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:email,phone',
            'value' => 'required|string',
        ]);

        try {
            $user = $request->user();
            $result = $this->userProfileService->requestUpdateOtp(
                $user,
                $request->type,
                $request->value
            );

            return $this->sendResponse($result, 'OTP sent successfully.');
        } catch (UrbanWatchException $e) {
            return $this->sendError($e->getMessage(), null, $e->getCode());
        } catch (\Exception $e) {
            Log::error('Profile Update Request Error: '.$e->getMessage());

            return $this->sendError('An unexpected error occurred.', 500);
        }
    }

    /**
     * Verify OTP and update contact info.
     */
    public function updateContactInfo(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:email,phone',
            'otp' => 'required|string|size:6',
        ]);

        try {
            $user = $this->userProfileService->verifyAndUpdateContactInfo(
                $request->user(),
                $request->type,
                $request->otp
            );

            return $this->sendResponse($user, 'Profile updated successfully.');
        } catch (UrbanWatchException $e) {
            return $this->sendError($e->getMessage(), null, $e->getCode());
        } catch (\Exception $e) {
            Log::error('Profile Update Confirm Error: '.$e->getMessage());

            return $this->sendError('An unexpected error occurred.', 500);
        }
    }

    /**
     * Update Password.
     */
    public function updatePassword(ChangePasswordRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $this->userProfileService->updatePassword(
                $request->user(),
                $request->currentPassword,
                $request->newPassword
            );

            return $this->sendResponse(null, 'Password updated successfully.');
        } catch (UrbanWatchException $e) {
            return $this->sendError($e->getMessage(), 400);
        } catch (\Exception $e) {
            Log::error('Password Update Error: '.$e->getMessage());

            return $this->sendError('An unexpected error occurred.', 500);
        }
    }

    /**
     * Upload and update profile avatar/photo.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        try {
            $user = $request->user();
            $file = $request->file('avatar');

            // Delete old photo if exists (handle both path and URL formats)
            if ($user->profile_photo_path) {
                $oldPath = $user->profile_photo_path;
                
                // If it's a full URL, extract the path
                if (filter_var($oldPath, FILTER_VALIDATE_URL)) {
                    $parsedUrl = parse_url($oldPath);
                    $oldPath = ltrim($parsedUrl['path'] ?? '', '/storage/');
                }
                
                // Try to delete from public disk
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Upload using existing service
            $uploadResult = $this->fileUploadService->uploadSingle($file, 'profile-photos');

            if (! $uploadResult['public_url']) {
                throw new \Exception('Failed to upload profile photo.');
            }

            // Store the storage path (not the full URL) for easier deletion later
            $user->forceFill([
                'profile_photo_path' => $uploadResult['storage_path'],
            ])->save();

            return $this->sendResponse([
                'profile_photo_path' => $uploadResult['storage_path'],
                'profile_photo_url' => $uploadResult['public_url'],
            ], 'Profile photo updated successfully.');
        } catch (\Exception $e) {
            Log::error('Profile Photo Upload Error: '.$e->getMessage());

            return $this->sendError('An unexpected error occurred during upload.', 500);
        }
    }
}
