<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\ResetPasswordRequest;
use App\Jobs\SendOtpJob;
use App\Models\CitizenDetails;
use App\Models\Otp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class PasswordResetController extends Controller
{
    /**
     * Request OTP for password reset via phone number.
     * This initiates the forgot password flow for mobile users.
     */
    public function requestResetOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|numeric|digits:11',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->phone;

        // Find user by phone number in CitizenDetails
        $citizenDetails = CitizenDetails::where('phone_number', $phone)->first();

        if (! $citizenDetails) {
            // Don't reveal if phone exists for security
            return response()->json([
                'success' => true,
                'message' => 'If a user with this phone number exists, an OTP will be sent.',
                'data' => ['phone' => $phone, 'expires_in' => 1],
            ]);
        }

        // Rate limiting: 60 seconds between requests
        if (Cache::has('password_reset_lock_'.$phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait 60 seconds before requesting again.',
            ], 429);
        }

        // Generate 6-digit OTP
        $code = rand(100000, 999999);

        // Store OTP in cache for 5 minutes (password reset gets longer expiry)
        Cache::put('password_reset_otp_'.$phone, $code, 300);
        Cache::put('password_reset_lock_'.$phone, true, 60);

        // Dispatch job to send SMS
        SendOtpJob::dispatch($phone, $code);

        return response()->json([
            'success' => true,
            'message' => 'If a user with this phone number exists, an OTP will be sent.',
            'data' => [
                'phone' => $phone,
                'expires_in' => 5, // minutes
            ],
        ]);
    }

    /**
     * Verify OTP and return a verification token for password reset.
     */
    public function verifyResetOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|numeric|digits:11',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $request->phone;
        $otpCode = $request->otp;

        // Check if OTP exists in cache
        $cachedOtp = Cache::get('password_reset_otp_'.$phone);

        if (! $cachedOtp || $cachedOtp != $otpCode) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired OTP code.',
            ], 400);
        }

        // OTP is valid - clear it
        Cache::forget('password_reset_otp_'.$phone);
        Cache::forget('password_reset_lock_'.$phone);

        // Generate a verification token (valid for 15 minutes)
        $tokenData = [
            'phone' => $phone,
            'purpose' => 'password_reset',
            'verified_at' => now()->toIso8601String(),
            'expires_at' => now()->addMinutes(15)->toIso8601String(),
        ];

        $verificationToken = Crypt::encryptString(json_encode($tokenData));

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully. You can now reset your password.',
            'data' => [
                'phone' => $phone,
                'verification_token' => $verificationToken,
            ],
        ]);
    }

    /**
     * Reset password using verification token from phone OTP verification.
     */
    public function resetWithPhone(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|numeric|digits:11',
            'verification_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Decrypt and validate verification token
        try {
            $tokenData = json_decode(Crypt::decryptString($request->verification_token), true);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification token.',
            ], 400);
        }

        // Validate token data
        if (
            ! isset($tokenData['phone']) ||
            ! isset($tokenData['purpose']) ||
            ! isset($tokenData['expires_at']) ||
            $tokenData['phone'] !== $request->phone ||
            $tokenData['purpose'] !== 'password_reset'
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification token.',
            ], 400);
        }

        // Check token expiration
        if (now()->isAfter($tokenData['expires_at'])) {
            return response()->json([
                'success' => false,
                'message' => 'Verification token has expired. Please request a new OTP.',
            ], 400);
        }

        // Find user by phone number
        $citizenDetails = CitizenDetails::where('phone_number', $request->phone)->first();

        if (! $citizenDetails) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $user = $citizenDetails->user;

        // Update password
        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        // Revoke all tokens (Security)
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password has been successfully reset. Please login with your new password.',
        ]);
    }

    /**
     * Reset password using verified OTP
     */
    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        // Check if the token exists in password_reset_tokens
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (! $record || ! Hash::check($request->token, $record->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired reset token.',
            ], 400);
        }

        // Check token expiration (e.g., 60 minutes)
        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json([
                'success' => false,
                'message' => 'Reset token expired.',
            ], 400);
        }

        // Update user password
        $user = User::where('email', $request->email)->first();

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        // Delete the used token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Also clean up the OTPs
        Otp::where('email', $request->email)
            ->where('type', 'forgot_password')
            ->delete();

        // Revoke all tokens (Security)
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password has been successfully reset.',
        ]);
    }
}
