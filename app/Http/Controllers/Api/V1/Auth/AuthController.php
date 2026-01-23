<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Exceptions\UrbanWatchException;
use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\PurokLeaderLoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Resources\Api\V1\AuthUserResource;
use App\Models\CitizenDetails;
use App\Models\User;
use App\Services\AbstractApiService;
use App\Services\AuthService;
use App\Services\GeminiService;
use App\Services\ImageProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends BaseApiController
{
    protected $authService;

    protected $abstractApiService;

    protected $geminiService;

    protected $imageService;

    public function __construct(AuthService $authService, AbstractApiService $abstractApiService, GeminiService $geminiService, ImageProcessingService $imageService)
    {
        $this->authService = $authService;
        $this->abstractApiService = $abstractApiService;
        $this->geminiService = $geminiService;
        $this->imageService = $imageService;
    }

    // ****LOGIN METHODD */

    public function login(LoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        try {
            $authData = $this->authService->login($validated['email'], $validated['password']);

            if (! $authData) {
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

            if (! $analysis['isAuthentic']) {
                return $this->sendError('ID verification failed: '.($analysis['reasoning'] ?? 'Image not recognized as a valid PhilID'), 400);
            }

            if ($this->authService->checkPcnNumberExists($analysis['data']['pcnNumber'])) {
                return $this->sendError('PhilSys ID Verification failed. Please ensure your ID is not already registered or contact support.', 400);
            }

            return $this->sendResponse([
                'verificationId' => uniqid('ver_'),
                'extractedData' => $analysis['data'],
                'confidence_score' => $analysis['confidence'],
            ], 'ID uploaded and verified successfully.');

        } catch (Exception $e) {
            Log::error('ID Upload Error', ['msg' => $e->getMessage()]);

            return $this->sendError('Unable to process ID card at this time.', 500);
        }
    }

    // Login for Purok Leader
    public function loginPurokLeader(PurokLeaderLoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        try {
            $authData = $this->authService->loginPurokLeader($validated['pin']);

            if (! $authData) {
                throw new UrbanWatchException('Invalid PIN');
            }

            $user = $authData['user'];

            if (! $user->officialDetails) {
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
            return $this->sendUnauthorized(message: 'Invalid PIN');
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
            if (! $request->user()->tokenCan('refresh-token')) {
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
            return $this->sendError('Registration failed: '.$e->getMessage());
        }
    }
}
