<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Exceptions\UrbanWatchException;
use App\Http\Controllers\Api\BaseApiController;
use App\Services\FileUploadService;
use App\Services\UserProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            return $this->sendError($e->getMessage(), $e->getCode());
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
            return $this->sendError($e->getMessage(), $e->getCode());
        } catch (\Exception $e) {
            Log::error('Profile Update Confirm Error: '.$e->getMessage());

            return $this->sendError('An unexpected error occurred.', 500);
        }
    }

    /**
     * Update Password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $this->userProfileService->updatePassword(
                $request->user(),
                $request->current_password,
                $request->new_password
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
     * Upload and update profile avatar.
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:5120', // 5MB max
        ]);

        try {
            $user = $request->user();
            $file = $request->file('avatar');

            // Upload using existing service
            $uploadResult = $this->fileUploadService->uploadSingle($file, 'avatars');

            if (! $uploadResult['public_url']) {
                throw new \Exception('Failed to upload avatar.');
            }

            // Update user profile photo path (assuming column exists or we add it)
            // Checking User model... standard Laravel has 'profile_photo_path' or similar.
            // Our User model migration doesn't explicitly show it in the list earlier,
            // but usually it's there or we can use a generic 'avatar' field.
            // Let's assume we need to add 'profile_photo_path' or check if it exists.
            // For now, I'll update 'profile_photo_path' assuming Jetstream/Fortify naming,
            // or I might need to add it in the migration if missing.

            // Wait, looking at previous file list, I didn't see a migration for avatar.
            // I should double check User model fillable/columns.
            // The User model doesn't have 'profile_photo_path' in fillable.
            // I will use 'profile_photo_path' and ensure it's in the migration.
            // Wait, I can't check database schema directly.
            // I'll assume I need to add it to the 'users' table migration I just made or a new one.
            // Since I just made a migration and haven't "run" it (in theory), I could edit it
            // OR make a new one. But the user said "manual migration", implies I can edit the file I just wrote?
            // No, better to stick to the plan. I'll just check if I can store it.
            // Actually, `User` model uses `HasProfilePhoto` trait usually if Jetstream.
            // But this looks like custom API setup.
            // I'll add `profile_photo_path` to the migration I just created since it's "manual" and hasn't been applied yet in this hypothetical flow.

            $user->forceFill([
                'profile_photo_path' => $uploadResult['public_url'],
            ])->save();

            return $this->sendResponse([
                'avatar_url' => $uploadResult['public_url'],
            ], 'Avatar updated successfully.');

        } catch (\Exception $e) {
            Log::error('Avatar Upload Error: '.$e->getMessage());

            return $this->sendError('An unexpected error occurred during upload.', 500);
        }
    }
}
