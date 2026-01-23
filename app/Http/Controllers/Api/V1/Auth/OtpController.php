<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendOtpJob;
use App\Models\Otp;
use App\Services\AbstractApiService;
use App\Services\MailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class OtpController extends Controller
{
    protected MailService $mailService;

    protected AbstractApiService $abstractApiService;

    public function __construct(MailService $mailService, AbstractApiService $abstractApiService)
    {
        $this->mailService = $mailService;
        $this->abstractApiService = $abstractApiService;
    }

    /**
     * Request OTP via SMS
     */
    public function requestOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|numeric|digits:11', // e.g., 09171234567
        ]);

        $phone = $request->phone;

        // Rate limiting: 60 seconds between requests
        if (Cache::has('otp_lock_'.$phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait 60 seconds before requesting again.',
            ], 429);
        }

        // Generate 6-digit OTP
        $code = rand(100000, 999999);

        // Store OTP in cache for 1 minute
        Cache::put('otp_'.$phone, $code, 60);
        Cache::put('otp_lock_'.$phone, true, 60);

        // Dispatch job to send SMS
        SendOtpJob::dispatch($phone, $code);

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully to your phone!',
            'data' => [
                'phone' => $phone,
                'expires_in' => 1, // minutes
            ],
        ]);
    }

    public function registrationOtp(Request $request): JsonResponse
    {

        $validator = Validator::make($request->all(), [
            'phone' => 'required|numeric|digits:11',
            'email' => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $emailReputationResult = $this->abstractApiService->validateEmail($request->email);

        if ($emailReputationResult['valid'] === false ||
             $emailReputationResult['deliverable'] === false ||
             $emailReputationResult['disposable'] === true) {
            return response()->json([
                'success' => false,
                'message' => 'The provided email address is not valid for registration.',
                'data' => $emailReputationResult,
            ], 422);
        }

        return $this->requestOtp($request);
    }

    /**
     * Verify OTP sent via SMS
     */
    public function verifyOtp(Request $request): JsonResponse
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

        // Rate limiting: 5 attempts per phone per 5 minutes
        $key = 'otp:verify:'.$phone;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many verification attempts. Please request a new OTP.',
            ], 429);
        }

        // Check if OTP exists in cache
        $cachedOtp = Cache::get('otp_'.$phone);

        if (! $cachedOtp) {
            RateLimiter::hit($key, 300);

            return response()->json([
                'success' => false,
                'message' => 'OTP has expired or does not exist. Please request a new one.',
            ], 400);
        }

        // Verify OTP code
        if ($cachedOtp != $otpCode) {
            RateLimiter::hit($key, 300);

            return response()->json([
                'success' => false,
                'message' => 'Incorrect OTP code.',
            ], 400);
        }

        // OTP is valid - clear it and rate limiter
        Cache::forget('otp_'.$phone);
        Cache::forget('otp_lock_'.$phone);
        RateLimiter::clear($key);

        // Generate a temporary verification token (valid for 15 minutes)
        $tokenData = [
            'phone' => $phone,
            'verified_at' => now()->toIso8601String(),
            'expires_at' => now()->addMinutes(15)->toIso8601String(),
        ];

        $verificationToken = Crypt::encryptString(json_encode($tokenData));

        return response()->json([
            'success' => true,
            'message' => 'OTP verified successfully',
            'data' => [
                'phone' => $phone,
                'verified' => true,
                'verificationToken' => $verificationToken,
            ],
        ]);
    }

    /**
     * Resend OTP via SMS
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|numeric|digits:11',
        ]);

        $phone = $request->phone;

        // Rate limiting: 60 seconds between resend requests
        if (Cache::has('otp_lock_'.$phone)) {
            $remainingTime = Cache::get('otp_lock_'.$phone);

            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting another OTP.',
            ], 429);
        }

        // Generate new 6-digit OTP
        $code = rand(100000, 999999);

        // Store OTP in cache for 1 minute
        Cache::put('otp_'.$phone, $code, 60);
        Cache::put('otp_lock_'.$phone, true, 60);

        // Dispatch job to send SMS
        SendOtpJob::dispatch($phone, $code);

        return response()->json([
            'success' => true,
            'message' => 'OTP resent successfully to your phone!',
            'data' => [
                'phone' => $phone,
                'expires_in' => 1, // minutes
            ],
        ]);
    }
}
