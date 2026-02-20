<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class PinService
{
    /**
     * Generate a random 4-digit PIN.
     * Ensures the PIN is not already in use by an active Purok Leader.
     *
     * @param  int  $maxAttempts  Maximum attempts to generate a unique PIN
     * @return string The generated 4-digit PIN
     *
     * @throws \RuntimeException if unable to generate unique PIN after max attempts
     */
    public function generateRandomPin(int $maxAttempts = 100): string
    {
        $attempts = 0;

        while ($attempts < $maxAttempts) {
            // Generate random 4-digit PIN (0000-9999)
            $pin = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            // Check if this PIN is already in use by an active Purok Leader
            if (! $this->isPinInUse($pin)) {
                return $pin;
            }

            $attempts++;
        }

        throw new \RuntimeException('Unable to generate unique PIN after '.$maxAttempts.' attempts');
    }

    /**
     * Check if a PIN is currently in use by an active Purok Leader.
     *
     * @param  string  $pin  The plaintext PIN to check
     * @return bool True if PIN is in use, false otherwise
     */
    private function isPinInUse(string $pin): bool
    {
        // Get all active Purok Leaders (role_id = 2)
        $purokLeaders = User::where('role_id', 2)
            ->whereHas('officialDetails', function ($query) {
                $query->where('status', 'active');
            })
            ->get();

        // Check if any active Purok Leader has this PIN
        foreach ($purokLeaders as $leader) {
            if (Hash::check($pin, $leader->password)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate and hash a new PIN.
     *
     * @return array{pin: string, hash: string} Returns both plaintext PIN and hashed version
     */
    public function generateAndHashPin(): array
    {
        $pin = $this->generateRandomPin();
        $hash = Hash::make($pin);

        return [
            'pin' => $pin,
            'hash' => $hash,
        ];
    }
}
