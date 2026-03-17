<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Jobs\SendOtpJob;
use App\Models\IdVerification;
use App\Models\Otp;
use App\Services\AbstractApiService;
use App\Services\IdVerificationService;
use App\Services\MailService;
use App\Services\RegistrationPhoneGuardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class OtpController extends Controller
{
    private const OTP_TTL_SECONDS = 300;

    private const OTP_COOLDOWN_SECONDS = 60;

    private const OTP_EXPIRY_MINUTES = 5;

    protected MailService $mailService;

    protected AbstractApiService $abstractApiService;

    protected RegistrationPhoneGuardService $registrationPhoneGuardService;

    protected IdVerificationService $idVerificationService;

    public function __construct(
        MailService $mailService,
        AbstractApiService $abstractApiService,
        RegistrationPhoneGuardService $registrationPhoneGuardService,
        IdVerificationService $idVerificationService
    ) {
        $this->mailService = $mailService;
        $this->abstractApiService = $abstractApiService;
        $this->registrationPhoneGuardService = $registrationPhoneGuardService;
        $this->idVerificationService = $idVerificationService;
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

        // Check if phone is globally locked from too many failed verification attempts
        $verifyKey = 'otp:verify:'.$phone;
        if (RateLimiter::tooManyAttempts($verifyKey, 5)) {
            $seconds = RateLimiter::availableIn($verifyKey);

            return response()->json([
                'success' => false,
                'message' => "Too many failed attempts. Please try again in $seconds seconds.",
                'lock_type' => 'rate_limit',
                'seconds' => $seconds,
            ], 429);
        }

        // Rate limiting: 60 seconds between requests
        if (Cache::has('otp_lock_'.$phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting again.',
                'lock_type' => 'cooldown',
                'seconds' => self::OTP_COOLDOWN_SECONDS,
            ], 429);
        }

        // Generate 6-digit OTP
        $code = random_int(100000, 999999);

        // Store OTP in cache for 5 minutes, but keep resend cooldown at 60 seconds.
        Cache::put('otp_'.$phone, $code, self::OTP_TTL_SECONDS);
        Cache::put('otp_lock_'.$phone, true, self::OTP_COOLDOWN_SECONDS);

        // Dispatch job to send SMS
        SendOtpJob::dispatch($phone, $code);

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully to your phone!',
            'data' => [
                'phone' => $phone,
                'expires_in' => self::OTP_EXPIRY_MINUTES,
            ],
        ]);
    }

    public function registrationOtp(Request $request): JsonResponse
    {

        $validator = Validator::make($request->all(), [
            'phone' => 'required|numeric|digits:11',
            'email' => 'required|email|unique:users,email',
            'verificationId' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $ocrEligibilityFailure = $this->resolveRegistrationOcrEligibility((string) $request->verificationId);
        if ($ocrEligibilityFailure !== null) {
            return $ocrEligibilityFailure;
        }

        if ($this->registrationPhoneGuardService->isPhoneRegistered($request->phone)) {
            return response()->json([
                'success' => false,
                'code' => 'PHONE_ALREADY_REGISTERED',
                'message' => 'This phone number is already registered. Please use a different phone number.',
            ], 422);
        }

        // Check lock FIRST before calling Abstract API (save resources)
        $phone = $request->phone;
        $verifyKey = 'otp:verify:'.$phone;
        if (RateLimiter::tooManyAttempts($verifyKey, 5)) {
            $seconds = RateLimiter::availableIn($verifyKey);

            return response()->json([
                'success' => false,
                'message' => "Too many failed attempts. Please try again in $seconds seconds.",
                'lock_type' => 'rate_limit',
                'seconds' => $seconds,
            ], 429);
        }

        // Check resend lock (60-second cooldown between OTP requests)
        if (Cache::has('otp_lock_'.$phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting again.',
                'lock_type' => 'cooldown',
                'seconds' => self::OTP_COOLDOWN_SECONDS,
            ], 429);
        }

        $emailReputationResult = $this->abstractApiService->validateEmail($request->email);

        if (($emailReputationResult['bypass'] ?? false) === true) {
            Log::warning('Registration OTP proceeded with Abstract API bypass', [
                'email_hash' => hash('sha256', strtolower(trim((string) $request->email))),
                'reason' => $emailReputationResult['error'] ?? null,
            ]);
        }

        $emailFailure = $this->resolveEmailValidationFailure($emailReputationResult);
        if ($emailFailure !== null) {
            return response()->json([
                'success' => false,
                'code' => $emailFailure['code'],
                'message' => $emailFailure['message'],
                'data' => $emailReputationResult,
            ], 422);
        }

        return $this->requestOtp($request);
    }

    private function resolveRegistrationOcrEligibility(string $verificationId): ?JsonResponse
    {
        $verification = IdVerification::query()->where('verification_id', $verificationId)->first();
        if (! $verification) {
            return response()->json([
                'success' => false,
                'code' => 'ID_VERIFICATION_NOT_FOUND',
                'message' => 'ID verification not found. Please upload your ID again.',
            ], 422);
        }

        $verification = $this->idVerificationService->markExpiredIfNeeded($verification);

        if (in_array($verification->status, ['pending', 'processing'], true)) {
            return response()->json([
                'success' => false,
                'code' => 'ID_VERIFICATION_NOT_COMPLETED',
                'message' => 'ID verification is still processing. Please wait before requesting OTP.',
                'ocrStatus' => $verification->status,
            ], 409);
        }

        if (in_array($verification->status, ['failed', 'expired'], true)) {
            return response()->json([
                'success' => false,
                'code' => 'ID_VERIFICATION_FAILED',
                'message' => $verification->failure_reason ?: 'ID verification failed. Please upload your ID again.',
                'ocrStatus' => $verification->status,
                'failureCode' => $verification->failure_code,
                'failureReason' => $verification->failure_reason,
            ], 422);
        }

        return null;
    }

    /**
     * Enforce strict-core registration email checks:
     * - format valid
     * - deliverable
     * - not disposable
     */
    private function resolveEmailValidationFailure(array $emailReputationResult): ?array
    {
        $isFormatValid = (bool) ($emailReputationResult['is_format_valid'] ?? true);
        $isDeliverable = (bool) ($emailReputationResult['deliverable'] ?? false);
        $isDisposable = (bool) ($emailReputationResult['disposable'] ?? false);

        if (! $isFormatValid) {
            return [
                'code' => 'EMAIL_INVALID_FORMAT',
                'message' => 'Please enter a valid email format.',
            ];
        }

        if (! $isDeliverable) {
            return [
                'code' => 'EMAIL_UNDELIVERABLE',
                'message' => 'Email is undeliverable. Please use a real and reachable email address.',
            ];
        }

        if ($isDisposable) {
            return [
                'code' => 'EMAIL_DISPOSABLE',
                'message' => 'Disposable email addresses are not allowed. Please use your primary email.',
            ];
        }

        return null;
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
            $seconds = RateLimiter::availableIn($key);

            return response()->json([
                'success' => false,
                'message' => "Too many verification attempts. Please try again in $seconds seconds.",
                'lock_type' => 'rate_limit',
                'seconds' => $seconds,
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

        // Check if phone is globally locked from too many failed verification attempts
        $verifyKey = 'otp:verify:'.$phone;
        if (RateLimiter::tooManyAttempts($verifyKey, 5)) {
            $seconds = RateLimiter::availableIn($verifyKey);

            return response()->json([
                'success' => false,
                'message' => "Too many failed attempts. Please try again in $seconds seconds.",
                'lock_type' => 'rate_limit',
                'seconds' => $seconds,
            ], 429);
        }

        // Rate limiting: 60 seconds between resend requests
        if (Cache::has('otp_lock_'.$phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Please wait before requesting another OTP.',
                'lock_type' => 'cooldown',
                'seconds' => self::OTP_COOLDOWN_SECONDS,
            ], 429);
        }

        // Generate new 6-digit OTP
        $code = random_int(100000, 999999);

        // Store OTP in cache for 5 minutes, but keep resend cooldown at 60 seconds.
        Cache::put('otp_'.$phone, $code, self::OTP_TTL_SECONDS);
        Cache::put('otp_lock_'.$phone, true, self::OTP_COOLDOWN_SECONDS);

        // Dispatch job to send SMS
        SendOtpJob::dispatch($phone, $code);

        return response()->json([
            'success' => true,
            'message' => 'OTP resent successfully to your phone!',
            'data' => [
                'phone' => $phone,
                'expires_in' => self::OTP_EXPIRY_MINUTES,
            ],
        ]);
    }
}
