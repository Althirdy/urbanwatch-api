<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Exceptions\UrbanWatchException;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\PurokLeaderLoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\VerifyPurokLeaderIdRequest;
use App\Http\Resources\Api\V1\AuthUserResource;
use App\Services\AbstractApiService;
use App\Services\AuthService;
use App\Services\GeminiService;
use App\Services\IdVerificationService;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends BaseApiController
{
    protected $authService;

    protected $abstractApiService;

    protected $geminiService;

    protected $imageService;

    protected $idVerificationService;

    public function __construct(AuthService $authService, AbstractApiService $abstractApiService, GeminiService $geminiService, ImageProcessingService $imageService, IdVerificationService $idVerificationService)
    {
        $this->authService = $authService;
        $this->abstractApiService = $abstractApiService;
        $this->geminiService = $geminiService;
        $this->imageService = $imageService;
        $this->idVerificationService = $idVerificationService;
    }

    // ****LOGIN METHODD */

    public function login(LoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        try {
            $authData = $this->authService->login($validated['email'], $validated['password']);

            if (!$authData) {
                throw new UrbanWatchException('Invalid credentials');
            }

            $user = $authData['user'];

            // if (($user->role_id == 1 || $user->role_id == 2) && !$user->officialDetails) {
            //     return $this->sendError(message: 'Official details not found for this user');
            // }

            // if ($user->role_id == 3 && !$user->citizenDetails) {
            //     return $this->sendError(message: 'Citizen details not found for this user');
            // }

            return $this->sendResponse([
                'token' => $authData['token'],
                'refreshToken' => $authData['refreshToken'],
                'user' => new AuthUserResource($user),
            ]);

        } catch (UrbanWatchException $e) {
            throw $e;
        } catch (\Exception $e) {
            return $this->sendError(message: 'Invalid Credentials');
        }
    }

    public function uploadNationalId(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,png,jpg,gif|max:5120', // max 5MB
        ]);

        try {
            $image = $request->file('image');
            $rawContent = $image->get();
            $mimeType = $image->getMimeType();

            $optimizedContent = $this->imageService->optimizeForAi($rawContent, $mimeType);

            $analysis = $this->geminiService->analyzeNationalId(
                $optimizedContent,
                $image->getMimeType()
            );

            if ($analysis['backSideDetected']) {
                return $this->sendError('You uploaded the back of the ID. Please upload the front.', 400);
            }

            if (!$analysis['isAuthentic']) {
                return $this->sendError('ID verification failed: ' . ($analysis['reasoning'] ?? 'Image not recognized as a valid PhilID'), 400);
            }

            // Check if user is outside allowed area (Barangay 176-E restriction)
            if ($analysis['isOutsideAllowedArea'] ?? false) {
                return $this->sendError($analysis['locationRestrictionReason'] ?? 'Registration is currently restricted to Barangay 176-E residents only.', 403);
            }

            if ($this->authService->checkPcnNumberExists($analysis['data']['pcnNumber'])) {
                return $this->sendError('PhilSys ID Verification failed. Please ensure your ID is not already registered or contact support.', 400);
            }

            return $this->sendResponse([
                'verificationId' => uniqid('ver_'),
                'extractedData' => $analysis['data'],
                'confidence_score' => $analysis['confidence'],
            ], 'ID uploaded and verified successfully.');

        } catch (\Exception $e) {
            Log::error('ID Upload Error', ['msg' => $e->getMessage()]);

            return $this->sendError('Unable to process ID card at this time.', 500);
        }
    }

    public function startNationalIdVerification(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'image' => 'required|file|mimes:jpeg,png,jpg,gif|max:5120',
            'deviceFingerprint' => 'nullable|string|max:191',
        ]);

        try {
            $verification = $this->idVerificationService->start(
                $request->file('image'),
                $request->ip(),
                $request->input('deviceFingerprint')
            );

            \App\Jobs\ProcessNationalIdOcrJob::dispatch($verification->id);

            return $this->sendResponse([
                'verificationId' => $verification->verification_id,
                'status' => $verification->status,
                'expiresAt' => $verification->expires_at?->toIso8601String(),
            ], 'ID verification started successfully.', 202);
        } catch (\Throwable $e) {
            Log::error('Start ID verification failed', ['error' => $e->getMessage()]);

            return $this->sendError('Unable to start ID verification. Please try again.', null, 500);
        }
    }

    public function getNationalIdVerificationStatus(string $verificationId): \Illuminate\Http\JsonResponse
    {
        $verification = \App\Models\IdVerification::where('verification_id', $verificationId)->first();

        if (!$verification) {
            return $this->sendNotFound('Verification request not found.');
        }

        $verification = $this->idVerificationService->markExpiredIfNeeded($verification);

        $result = $verification->result_json ?? [];

        return $this->sendResponse([
            'verificationId' => $verification->verification_id,
            'status' => $verification->status,
            'expiresAt' => $verification->expires_at?->toIso8601String(),
            'completedAt' => $verification->processed_at?->toIso8601String(),
            'failureReason' => $verification->failure_reason,
            'confidenceScore' => $verification->confidence,
            'extractedData' => $verification->status === 'completed' ? ($result['data'] ?? null) : null,
            'flags' => $verification->flags,
        ]);
    }

    // Login for Purok Leader
    public function loginPurokLeader(PurokLeaderLoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        try {
            $authData = $this->authService->loginPurokLeader($validated['id_number'], $validated['pin']);

            if (!$authData) {
                throw new UrbanWatchException('Invalid ID Number or PIN');
            }

            $user = $authData['user'];

            if (!$user->officialDetails) {
                throw new UrbanWatchException('Official details not found for this user');
            }

            return $this->sendResponse([
                'token' => $authData['token'],
                'refreshToken' => $authData['refreshToken'],
                'user' => new AuthUserResource($user),
            ], 'Login successful');
        } catch (UrbanWatchException $e) {
            throw $e;
        } catch (\Exception $e) {
            return $this->sendUnauthorized(message: 'Invalid ID Number or PIN');
        }
    }

    // Verify Purok Leader ID Number (Step 1 of 2-step login)
    public function verifyPurokLeaderId(VerifyPurokLeaderIdRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        try {
            $result = $this->authService->verifyPurokLeaderId($validated['id_number']);

            if (!$result) {
                throw new UrbanWatchException('ID Number not found. Please check and try again.');
            }

            return $this->sendResponse([
                'name' => $result['name'],
                'id_number' => $result['id_number'],
            ], 'ID Number verified successfully');
        } catch (UrbanWatchException $e) {
            throw $e;
        } catch (\Exception $e) {
            return $this->sendError('Verification failed. Please try again.', 500);
        }
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Revoke the current token
            $request->user()->currentAccessToken()->delete();
            $request->user()->tokens()->delete();

            return $this->sendResponse(null, 'Logout successful');
        } catch (\Exception $e) {
            return $this->sendError('An error occurred during logout');
        }
    }

    public function user(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = $request->user()->load(['role', 'officialDetails', 'citizenDetails']);

            // if (($user->role_id == 1 || $user->role_id == 2) && !$user->officialDetails) {
            //     return $this->sendError('Official details not found for this user');
            // }

            // if ($user->role_id == 3 && !$user->citizenDetails) {
            //     return $this->sendError('Citizen details not found for this user');
            // }

            // if (!in_array($user->role_id, [1, 2, 3])) {
            //     return $this->sendError('Invalid user role');
            // }

            return $this->sendResponse([
                'user' => new AuthUserResource($user),
            ]);
        } catch (\Exception $e) {
            return $this->sendError('An error occurred while retrieving user details');
        }
    }

    public function refreshToken(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            // Verify the token has 'refresh-token' ability
            if (!$request->user()->tokenCan('refresh-token')) {
                return $this->sendUnauthorized('Invalid token type. Please use refresh token.');
            }

            $tokens = $this->authService->refreshToken($request->user());

            return $this->sendResponse($tokens, 'Token refreshed successfully');
        } catch (\Exception $e) {
            return $this->sendError('An error occurred while refreshing the token');
        }
    }

    public function register(RegisterRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        try {
            $authData = $this->authService->register($validated);

            return $this->sendResponse([
                'token' => $authData['token'],
                'refreshToken' => $authData['refreshToken'],
                'user' => new AuthUserResource($authData['user']),
            ], 'Registration successful');
        } catch (UrbanWatchException $e) {
            throw $e;
        } catch (\Exception $e) {
            return $this->sendError('Registration failed: ' . $e->getMessage());
        }
    }
}
