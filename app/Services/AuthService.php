<?php

namespace App\Services;

use App\Exceptions\UrbanWatchException;
use App\Models\CitizenDetails;
use App\Models\IdVerification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthService
{
    public function login(string $email, string $password)
    {
        $user = User::with(['role', 'officialDetails', 'citizenDetails'])
            ->where('email', $email)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        return $this->generateAuthData($user);
    }

    public function loginPurokLeader(string $idNumber, string $pin)
    {
        $user = User::with(['role', 'officialDetails'])
            ->where('role_id', 2)
            ->whereHas('officialDetails', function ($query) use ($idNumber) {
                $query->where('id_number', $idNumber);
            })
            ->first();

        if (! $user) {
            \Log::warning('Purok leader login failed: No matching ID Number found.', ['id_number' => $idNumber]);

            return null;
        }

        // Check if user status is active
        $status = $user->officialDetails?->status ?? 'active';
        if (strtolower($status) !== 'active') {
            throw new UrbanWatchException('Your account is currently inactive. Please contact your administrator.', 403);
        }

        if (! Hash::check($pin, $user->password)) {
            \Log::warning('Purok leader login failed: Invalid PIN.', ['id_number' => $idNumber]);

            return null;
        }

        return $this->generateAuthData($user);
    }

    public function verifyPurokLeaderId(string $idNumber)
    {
        $user = User::with(['role', 'officialDetails'])
            ->where('role_id', 2)
            ->whereHas('officialDetails', function ($query) use ($idNumber) {
                $query->where('id_number', $idNumber);
            })
            ->first();

        if (! $user) {
            return null;
        }

        // Check if user status is active
        $status = $user->officialDetails?->status ?? 'active';
        if (strtolower($status) !== 'active') {
            throw new UrbanWatchException('Your account is currently inactive. Please contact your administrator.', 403);
        }

        return [
            'name' => $user->name,
            'id_number' => $user->officialDetails->id_number,
        ];
    }

    public function register(array $data)
    {
        $verification = IdVerification::where('verification_id', $data['verificationId'])->first();
        if (! $verification) {
            throw new UrbanWatchException('ID verification not found. Please upload your ID again.', 403);
        }

        if ($verification->expires_at && Carbon::parse($verification->expires_at)->isPast()) {
            throw new UrbanWatchException('ID verification has expired. Please upload your ID again.', 403);
        }

        if ($verification->status !== 'completed') {
            throw new UrbanWatchException('ID verification is not complete yet. Please wait.', 403);
        }

        $verificationResult = $verification->result_json ?? [];
        $verifiedPcn = $verificationResult['data']['pcnNumber'] ?? null;
        if (! $verifiedPcn || $verifiedPcn !== $data['pcnNumber']) {
            throw new UrbanWatchException('PCN does not match verified ID data.', 403);
        }

        // 1. Verify OTP Token (Verified Token Pattern)
        try {
            $decryptedToken = Crypt::decryptString($data['verificationToken']);
            $tokenData = json_decode($decryptedToken, true);

            if (! $tokenData || ! isset($tokenData['phone']) || ! isset($tokenData['expires_at'])) {
                throw new \Exception('Invalid token format.');
            }

            // Check Expiration
            if (Carbon::parse($tokenData['expires_at'])->isPast()) {
                throw new UrbanWatchException('Verification token has expired. Please request a new OTP.', 403);
            }

            // Check Phone Match
            if ($tokenData['phone'] !== $data['phoneNumber']) {
                throw new UrbanWatchException('Phone number mismatch. Please verify your phone number again.', 403);
            }

        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            throw new UrbanWatchException('Invalid verification token.', 403);
        } catch (UrbanWatchException $e) {
            throw $e;
        } catch (\Exception $e) {
            throw new UrbanWatchException('Verification failed: '.$e->getMessage(), 403);
        }

        DB::beginTransaction();
        try {
            $fullName = trim($data['firstName'].' '.
                ($data['middleName'] ?? '').' '.
                $data['lastName'].
                ($data['suffix'] ? ' '.$data['suffix'] : ''));

            $user = User::create([
                'name' => $fullName,
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
                'role_id' => 3,
            ]);

            CitizenDetails::create([
                'user_id' => $user->id,
                'pcn_number' => $data['pcnNumber'],
                'first_name' => $data['firstName'],
                'middle_name' => $data['middleName'] ?? null,
                'last_name' => $data['lastName'],
                'suffix' => $data['suffix'] ?? null,
                'date_of_birth' => $data['dateOfBirth'],
                'phone_number' => $data['phoneNumber'],
                'address' => $data['address'],
                'barangay' => $data['barangay'],
                'city' => $data['city'],
                'province' => $data['province'],
                'postal_code' => $data['postalCode'],
                'is_verified' => true,
                'status' => 'active',
            ]);

            $verification->update([
                'status' => 'expired',
                'failure_reason' => null,
            ]);

            DB::commit();

            return $this->generateAuthData($user);
        } catch (\Exception $e) {
            DB::rollBack();
            throw new UrbanWatchException('Registration failed: '.$e->getMessage());
        }
    }

    public function refreshToken(User $user)
    {
        $user->tokens()->delete();

        $access_token = $user->createToken('mobile-app', ['access-api'], Carbon::now()->addMinutes(config('sanctum.access_token_expiration')))->plainTextToken;
        $refresh_token = $user->createToken('mobile-app-refresh', ['refresh-token'], Carbon::now()->addMinutes(config('sanctum.refresh_token_expiration')))->plainTextToken;

        return [
            'token' => $access_token,
            'refreshToken' => $refresh_token,
        ];
    }

    public function generateAuthData(User $user)
    {
        $access_token = $user->createToken('mobile-app', ['access-api'], Carbon::now()->addMinutes(config('sanctum.access_token_expiration')))->plainTextToken;
        $refresh_token = $user->createToken('mobile-app-refresh', ['refresh-token'], Carbon::now()->addMinutes(config('sanctum.refresh_token_expiration')))->plainTextToken;

        return [
            'token' => $access_token,
            'refreshToken' => $refresh_token,
            'user' => $user,
        ];
    }

    public function checkPcnNumberExists(string $pcnNumber): bool
    {
        return CitizenDetails::where('pcn_number', $pcnNumber)->exists();
    }
}
