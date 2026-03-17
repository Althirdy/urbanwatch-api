<?php

namespace App\Services;

use App\Models\CitizenDetails;
use App\Models\OfficialsDetails;
use Illuminate\Support\LazyCollection;
use Throwable;

class RegistrationPhoneGuardService
{
    public function isPhoneRegistered(?string $rawPhone): bool
    {
        $normalizedPhone = $this->normalizePhilippinePhone($rawPhone);
        if (! $normalizedPhone) {
            return false;
        }

        return $this->existsInCitizens($normalizedPhone) || $this->existsInOfficials($normalizedPhone);
    }

    public function normalizePhilippinePhone(?string $rawPhone): ?string
    {
        if (! is_string($rawPhone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $rawPhone);
        if (! $digits) {
            return null;
        }

        if (str_starts_with($digits, '63') && strlen($digits) === 12) {
            $digits = '0'.substr($digits, 2);
        } elseif (str_starts_with($digits, '9') && strlen($digits) === 10) {
            $digits = '0'.$digits;
        }

        if (preg_match('/^09\d{9}$/', $digits) !== 1) {
            return null;
        }

        return $digits;
    }

    private function existsInCitizens(string $normalizedPhone): bool
    {
        return $this->matchesPhone(
            CitizenDetails::query()->select(['id', 'phone_number'])->lazyById(500, 'id'),
            fn (CitizenDetails $detail) => $detail->phone_number,
            $normalizedPhone
        );
    }

    private function existsInOfficials(string $normalizedPhone): bool
    {
        return $this->matchesPhone(
            OfficialsDetails::query()->select(['id', 'contact_number'])->lazyById(500, 'id'),
            fn (OfficialsDetails $detail) => $detail->contact_number,
            $normalizedPhone
        );
    }

    /**
     * @template T
     *
     * @param  LazyCollection<int, T>  $records
     * @param  callable(T): mixed  $phoneResolver
     */
    private function matchesPhone(LazyCollection $records, callable $phoneResolver, string $normalizedPhone): bool
    {
        foreach ($records as $record) {
            try {
                $candidate = $phoneResolver($record);
            } catch (Throwable) {
                continue;
            }

            $normalizedCandidate = $this->normalizePhilippinePhone(
                is_string($candidate) || is_numeric($candidate) ? (string) $candidate : null
            );

            if ($normalizedCandidate !== null && hash_equals($normalizedCandidate, $normalizedPhone)) {
                return true;
            }
        }

        return false;
    }
}
