<?php

namespace App\Support;

class PcnNormalizer
{
    /**
     * Keep digits only so format variants like spaces/hyphens are comparable.
     */
    public static function normalize(?string $pcn): string
    {
        $value = trim((string) $pcn);
        if ($value === '') {
            return '';
        }

        return preg_replace('/\D+/', '', $value) ?? '';
    }

    /**
     * Canonical display/storage format for 16-digit PCN values.
     */
    public static function toDashed(?string $pcn): ?string
    {
        $normalized = self::normalize($pcn);
        if ($normalized === '') {
            return null;
        }

        if (strlen($normalized) !== 16) {
            return $normalized;
        }

        return implode('-', str_split($normalized, 4));
    }

    public static function equals(?string $left, ?string $right): bool
    {
        $normalizedLeft = self::normalize($left);
        $normalizedRight = self::normalize($right);

        if ($normalizedLeft === '' || $normalizedRight === '') {
            return false;
        }

        return hash_equals($normalizedLeft, $normalizedRight);
    }
}
