<?php

namespace App\Http\Controllers\Api\V1\PurokLeader;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\PurokLeader\ChangePinRequest;
use App\Models\PurokPinLog;
use App\Services\AuthService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PinController extends BaseApiController
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Change Purok Leader's PIN (self-service).
     * Required when is_default = true (operator-generated PIN).
     */
    public function change(ChangePinRequest $request)
    {
        try {
            DB::beginTransaction();

            // Lock the user row to prevent race conditions
            $user = $request->user();
            $userLocked = \App\Models\User::where('id', $user->id)->lockForUpdate()->first();

            // Verify current PIN AFTER acquiring lock (prevents TOCTOU race condition)
            if (!Hash::check($request->current_pin, $userLocked->password)) {
                DB::rollBack();
                return $this->sendUnauthorized('Current PIN is incorrect');
            }

            // Hash new PIN
            $hashedPin = Hash::make($request->new_pin);

            // Update user's password
            $userLocked->update([
                'password' => $hashedPin,
            ]);

            // Create audit log entry (user-initiated change)
            PurokPinLog::create([
                'purok_leader_id' => $user->id,
                'reset_by_operator_id' => null, // User-initiated, not operator
                'reason' => 'User-initiated PIN change',
                'is_default' => false, // User-changed PIN allows full access
            ]);

            // Invalidate all existing tokens (force re-login)
            $userLocked->tokens()->delete();

            // Generate new token pair
            $authData = $this->authService->generateAuthData($userLocked);

            DB::commit();

            return $this->sendResponse([
                'token' => $authData['token'],
                'refreshToken' => $authData['refreshToken'],
            ], 'PIN changed successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to change Purok Leader PIN: ' . $e->getMessage());

            return $this->sendError('Failed to change PIN. Please try again.', null, 500);
        }
    }
}
