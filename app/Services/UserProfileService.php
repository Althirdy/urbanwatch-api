<?php

namespace App\Services;

use App\Exceptions\UrbanWatchException;
use App\Jobs\SendOtpJob;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserProfileService
{
    protected $abstractApiService;

    public function __construct(AbstractApiService $abstractApiService)
    {
        $this->abstractApiService = $abstractApiService;
    }

    /**
     * Request an OTP for a sensitive profile update (Email or Phone).
     *
     * @param  string  $type  'email' or 'phone'
     * @param  string  $newValue  The new value to be set
     *
     * @throws UrbanWatchException
     */
    public function requestUpdateOtp(User $user, string $type, string $newValue): array
    {
        // 1. Check Cooldown (30 Days)
        if ($user->last_sensitive_update_at && Carbon::parse($user->last_sensitive_update_at)->addDays(30)->isFuture()) {
            $daysLeft = (int) ceil(now()->floatDiffInDays(Carbon::parse($user->last_sensitive_update_at)->addDays(30)));
            throw new UrbanWatchException("For security, you can only update your contact information once every 30 days. Please try again in $daysLeft days.", 403);
        }

        // 2. Validate New Value
        if ($type === 'email') {
            // Check uniqueness
            if (User::where('email', $newValue)->exists()) {
                throw new UrbanWatchException('The email address is already in use.', 422);
            }

            // Abstract API Validation
            $emailValidation = $this->abstractApiService->validateEmail($newValue);
            if (! $emailValidation['valid'] || ! $emailValidation['deliverable'] || $emailValidation['disposable']) {
                throw new UrbanWatchException('The provided email address is invalid or disposable.', 422);
            }

            // For email change, we still verify via SMS to the CURRENT phone number for security
            $phoneToSendOtp = $user->citizenDetails?->phone_number ?? $user->officialDetails?->contact_number;

            if (! $phoneToSendOtp) {
                throw new UrbanWatchException('No phone number found associated with this account.', 404);
            }

        } elseif ($type === 'phone') {
            // Check uniqueness in CitizenDetails and OfficialsDetails
            $existsInCitizen = \App\Models\CitizenDetails::where('phone_number', $newValue)->exists();
            $existsInOfficial = \App\Models\OfficialsDetails::where('contact_number', $newValue)->exists();

            if ($existsInCitizen || $existsInOfficial) {
                throw new UrbanWatchException('The phone number is already in use.', 422);
            }

            // For phone change, we send OTP to the NEW phone number to verify ownership
            $phoneToSendOtp = $newValue;
        } else {
            throw new UrbanWatchException('Invalid update type.', 400);
        }

        // 3. Generate and Send OTP
        $otp = (string) rand(100000, 999999);
        $cacheKey = "profile_update_otp_{$user->id}_{$type}";

        // Store OTP with new value in cache (expires in 10 mins)
        Cache::put($cacheKey, [
            'otp' => $otp,
            'new_value' => $newValue,
        ], 600);

        // Send SMS
        SendOtpJob::dispatch($phoneToSendOtp, $otp);

        return [
            'message' => 'OTP sent successfully.',
            'target_phone' => $phoneToSendOtp,
            'expires_in' => 600,
        ];
    }

    /**
     * Verify OTP and update the user's contact info.
     *
     * @param  string  $type  'email' or 'phone'
     *
     * @throws UrbanWatchException
     */
    public function verifyAndUpdateContactInfo(User $user, string $type, string $otp): User
    {
        $cacheKey = "profile_update_otp_{$user->id}_{$type}";
        $cachedData = Cache::get($cacheKey);

        if (! $cachedData || $cachedData['otp'] !== $otp) {
            throw new UrbanWatchException('Invalid or expired OTP.', 400);
        }

        $newValue = $cachedData['new_value'];

        DB::beginTransaction();
        try {
            if ($type === 'email') {
                $user->email = $newValue;
                $user->email_verified_at = now(); // Auto-verify since we checked it
            } elseif ($type === 'phone') {
                // Update citizen details if exists
                if ($user->citizenDetails) {
                    $user->citizenDetails->update(['phone_number' => $newValue]);
                } elseif ($user->officialDetails) {
                    $user->officialDetails->update(['contact_number' => $newValue]);
                }
            }

            $user->last_sensitive_update_at = now();
            $user->save();

            DB::commit();

            // Clear cache
            Cache::forget($cacheKey);

            return $user;

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Profile Update Failed: '.$e->getMessage());
            throw new UrbanWatchException('Failed to update profile. Please try again.', 500);
        }
    }

    /**
     * Update user password.
     */
    public function updatePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw new UrbanWatchException('Current password is incorrect.', 400);
        }

        $user->password = Hash::make($newPassword);
        $user->save();
    }
}
