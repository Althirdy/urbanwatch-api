<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\CitizenDetails;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'national_id' => 'required|string|size:12|unique:citizen_details',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'date_of_birth' => 'required|date',
            'phone_number' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'barangay' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'postal_code' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            \Log::error('Registration validation failed', [
                'errors' => $validator->errors(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            \Log::info('Starting user registration', ['email' => $request->email]);
            
            // Create user with role_id: 3 (Citizen)
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name, // Combined name for users table
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => 3, // Citizen role
                'email_verified_at' => null, // Email not verified yet
            ]);
            
            \Log::info('User created successfully', ['user_id' => $user->id]);

            // Create citizen_details
            $citizenDetail = CitizenDetails::create([
                'user_id' => $user->id,
                'national_id' => $request->national_id,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'suffix' => $request->suffix,
                'date_of_birth' => $request->date_of_birth,
                'phone_number' => $request->phone_number,
                'address' => $request->address,
                'barangay' => $request->barangay,
                'city' => $request->city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
                'is_verified' => true,
            ]);
            
            \Log::info('CitizenDetails created successfully', ['citizen_id' => $citizenDetail->id]);

            // Temporarily consider email verified for mobile registration
            $user->email_verified_at = now();
            $user->save();

            // Generate token for immediate login
            $token = $user->createToken('auth_token')->plainTextToken;

            // Return user data in the format expected by your mobile app
            return response()->json([
                'message' => 'User registered successfully',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'firstName' => $request->first_name,
                        'lastName' => $request->last_name,
                        'middleName' => $request->middle_name,
                        'suffix' => $request->suffix,
                        'email' => $user->email,
                        'nationalId' => $request->national_id,
                        'phoneNumber' => $request->phone_number,
                        'role' => 'Citizen',
                        'address' => $request->address,
                        'barangay' => $request->barangay,
                        'city' => $request->city,
                        'province' => $request->province,
                        'zipCode' => $request->postal_code,
                        'is_verified' => true,
                        'email_verified_at' => $user->email_verified_at,
                    ]
                ]
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Registration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify email verification code
     */
    public function verifyEmailCode(Request $request)
    {
        // For now, accept any code and mark as verified
        $user = $request->user();
        $user->email_verified_at = now();
        $user->save();

        if ($user->citizenDetails) {
            $user->citizenDetails->update(['is_verified' => true]);
        }

        return response()->json([
            'message' => 'Email verified successfully',
            'verified' => true
        ]);
    }

    /**
     * Resend verification code
     */
    public function resendVerificationCode(Request $request)
    {
        // For now, do nothing and return success
        return response()->json([
            'message' => 'Verification skipped (development mode)',
            'status' => 'ok'
        ]);
    }

    /**
     * Check email verification status
     */
    public function checkEmailVerification(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'verified' => $user->hasVerifiedEmail(),
            'email' => $user->email
        ]);
    }
}
