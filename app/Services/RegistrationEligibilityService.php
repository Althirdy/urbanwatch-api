<?php

namespace App\Services;

use App\Models\CitizenDetails;
use Illuminate\Support\Facades\Log;

class RegistrationEligibilityService
{
    /**
     * Evaluate whether an OCR result can proceed to registration.
     *
     * Rules:
     * 1) If PCN already exists -> fail.
     * 2) If ID address/flag indicates PH9 -> pass.
     * 3) Otherwise require current location inside Brgy 176E boundary.
     *
     * @return array{
     *   eligible: bool,
     *   failureCode: string|null,
     *   failureReason: string|null,
     *   flags: array<string, bool>
     * }
     */
    public function evaluate(array $analysis, ?float $latitude, ?float $longitude): array
    {
        $pcn = (string) ($analysis['data']['pcnNumber'] ?? '');
        $pcn = trim($pcn);

        if ($pcn !== '' && CitizenDetails::where('pcn_number', $pcn)->exists()) {
            return $this->fail(
                'PCN_ALREADY_REGISTERED',
                'This National ID is already registered in UrbanWatch.',
                [
                    'pcn_already_registered' => true,
                    'is_phase9_resident' => false,
                    'used_location_fallback' => false,
                    'capture_location_missing' => false,
                    'within_boundary' => false,
                ]
            );
        }

        $isPhase9Resident = $this->isPhase9Resident($analysis);
        if ($isPhase9Resident) {
            return $this->pass([
                'pcn_already_registered' => false,
                'is_phase9_resident' => true,
                'used_location_fallback' => false,
                'capture_location_missing' => false,
                'within_boundary' => false,
            ]);
        }

        if ($latitude === null || $longitude === null) {
            return $this->fail(
                'NON_PH9_LOCATION_REQUIRED',
                'ID address is not in PH9. Please enable location and scan again to verify current residence inside Barangay 176-E.',
                [
                    'pcn_already_registered' => false,
                    'is_phase9_resident' => false,
                    'used_location_fallback' => true,
                    'capture_location_missing' => true,
                    'within_boundary' => false,
                ]
            );
        }

        $isWithinBoundary = $this->isInsideBoundary($latitude, $longitude);
        if (! $isWithinBoundary) {
            return $this->fail(
                'OUTSIDE_176_BOUNDARY',
                'Registration is allowed only for current residents inside Barangay 176-E boundary.',
                [
                    'pcn_already_registered' => false,
                    'is_phase9_resident' => false,
                    'used_location_fallback' => true,
                    'capture_location_missing' => false,
                    'within_boundary' => false,
                ]
            );
        }

        return $this->pass([
            'pcn_already_registered' => false,
            'is_phase9_resident' => false,
            'used_location_fallback' => true,
            'capture_location_missing' => false,
            'within_boundary' => true,
        ]);
    }

    private function isPhase9Resident(array $analysis): bool
    {
        if ((bool) ($analysis['isPhase9Resident'] ?? false)) {
            return true;
        }

        $address = strtoupper((string) ($analysis['data']['address'] ?? ''));
        if ($address === '') {
            return false;
        }

        return preg_match('/\bPH\.?\s*9\b|\bPHASE\s*9\b/i', $address) === 1;
    }

    private function isInsideBoundary(float $latitude, float $longitude): bool
    {
        $vertices = config('geofencing.boundary');
        if (empty($vertices) || ! is_array($vertices)) {
            Log::warning('RegistrationEligibilityService: geofencing boundary is missing or invalid.');

            return false;
        }

        $x = $longitude;
        $y = $latitude;

        $inside = false;
        $count = count($vertices);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = (float) ($vertices[$i][0] ?? 0.0);
            $yi = (float) ($vertices[$i][1] ?? 0.0);
            $xj = (float) ($vertices[$j][0] ?? 0.0);
            $yj = (float) ($vertices[$j][1] ?? 0.0);

            $intersect = (($yi > $y) !== ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / (($yj - $yi) ?: 1.0) + $xi);

            if ($intersect) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    /**
     * @param  array<string, bool>  $flags
     * @return array{eligible: bool, failureCode: string|null, failureReason: string|null, flags: array<string, bool>}
     */
    private function pass(array $flags): array
    {
        return [
            'eligible' => true,
            'failureCode' => null,
            'failureReason' => null,
            'flags' => $flags,
        ];
    }

    /**
     * @param  array<string, bool>  $flags
     * @return array{eligible: bool, failureCode: string|null, failureReason: string|null, flags: array<string, bool>}
     */
    private function fail(string $failureCode, string $failureReason, array $flags): array
    {
        return [
            'eligible' => false,
            'failureCode' => $failureCode,
            'failureReason' => $failureReason,
            'flags' => $flags,
        ];
    }
}
