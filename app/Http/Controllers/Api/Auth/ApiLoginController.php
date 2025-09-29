<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ApiLoginController extends BaseApiController
{
    //****LOGIN METHODD */

    public function login(LoginRequest $request): \Illuminate\Http\JsonResponse
    {
        $validated = $request->validated();

        try {
            $user = User::with(['role', 'officialDetails', 'citizenDetails'])
                ->where('email', $validated['email'])
                ->firstOrFail();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return $this->sendUnauthorized('Invalid credentials');
            }

            $token = $user->createToken('mobile-app')->plainTextToken;

            if ($user['role_id'] == 2 || $user['role_id'] == 1) {
                $officialDetails = $user->officialDetails;

                if (!$officialDetails) {
                    return $this->sendError('Official details not found for this user');
                }

                return $this->sendResponse([
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'firstName' => $officialDetails->first_name,
                        'lastName' => $officialDetails->last_name,
                        'middleName' => $officialDetails->middle_name,
                        'suffix' => $officialDetails->suffix,
                        'email' => $user->email,
                        'role' => $user->role->name,
                        'officeAddress' => $officialDetails->office_address,
                        'phoneNumber' => $officialDetails->contact_number,
                    ]
                ]);
            } else if ($user['role_id'] == 3) {
                $citizenDetails = $user->citizenDetails;

                if (!$citizenDetails) {
                    return $this->sendError('Citizen details not found for this user');
                }

                return $this->sendResponse([
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'firstName' => $citizenDetails->first_name,
                        'lastName' => $citizenDetails->last_name,
                        'middleName' => $citizenDetails->middle_name,
                        'suffix' => $citizenDetails->suffix,
                        'email' => $user->email,
                        'role' => $user->role->name,
                        'address' => $citizenDetails->address,
                        'phoneNumber' => $citizenDetails->phone_number,
                        'barangay' => $citizenDetails->barangay,
                        'city' => $citizenDetails->city,
                        'province' => $citizenDetails->province,
                        'postalCode' => $citizenDetails->postal_code,
                        'isVerified' => $citizenDetails->is_verified,
                    ]
                ]);
            }

            return $this->sendError('Invalid user role');
        } catch (\Exception $e) {
            return $this->sendError('Invalid Credentials');
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

            return $this->sendResponse(null, 'Logout successful');
        } catch (\Exception $e) {
            return $this->sendError('An error occurred during logout');
        }
    }

    public function user(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = $request->user()->load(['role', 'officialDetails', 'citizenDetails']);

            if ($user['role_id'] == 2 || $user['role_id'] == 1) {
                $officialDetails = $user->officialDetails;

                if (!$officialDetails) {
                    return $this->sendError('Official details not found for this user');
                }

                return $this->sendResponse([
                    'user' => [
                        'id' => $user->id,
                        'firstName' => $officialDetails->first_name,
                        'lastName' => $officialDetails->last_name,
                        'middleName' => $officialDetails->middle_name,
                        'suffix' => $officialDetails->suffix,
                        'email' => $user->email,
                        'role' => $user->role->name,
                        'officeAddress' => $officialDetails->office_address,
                        'phoneNumber' => $officialDetails->contact_number,
                    ]
                ]);
            } else if ($user['role_id'] == 3) {
                $citizenDetails = $user->citizenDetails;

                if (!$citizenDetails) {
                    return $this->sendError('Citizen details not found for this user');
                }

                return $this->sendResponse([
                    'user' => [
                        'id' => $user->id,
                        'firstName' => $citizenDetails->first_name,
                        'lastName' => $citizenDetails->last_name,
                        'middleName' => $citizenDetails->middle_name,
                        'suffix' => $citizenDetails->suffix,
                        'email' => $user->email,
                        'role' => $user->role->name,
                        'address' => $citizenDetails->address,
                        'phoneNumber' => $citizenDetails->phone_number,
                        'barangay' => $citizenDetails->barangay,
                        'city' => $citizenDetails->city,
                        'province' => $citizenDetails->province,
                        'zipCode' => $citizenDetails->postal_code,
                        'isVerified' => $citizenDetails->is_verified,
                    ]
                ]);
            }

            return $this->sendError('Invalid user role');
        } catch (\Exception $e) {
            return $this->sendError('An error occurred while retrieving user details');
        }
    }
}
