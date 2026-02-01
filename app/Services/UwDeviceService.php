<?php

namespace App\Services;

use App\Models\UwDevice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UwDeviceService
{
    /**
     * Create a new UW Device with an API token.
     */
    public function createDevice(array $data): UwDevice
    {
        return DB::transaction(function () use ($data) {
            // Force generate a unique 6-digit device_id as serial number
            $data['device_id'] = $this->generateUniqueDeviceId();

            $data['api_token'] = 'uw_live_'.Str::random(40);

            $device = UwDevice::create($data);

            Log::info('UW Device created via Service:', [
                'id' => $device->id,
                'device_id' => $device->device_id,
                'name' => $device->device_name,
            ]);

            return $device;
        });
    }

    /**
     * Generate a unique 6-digit device ID as a string.
     */
    private function generateUniqueDeviceId(): string
    {
        do {
            $deviceId = (string) random_int(100000, 999999);
        } while (UwDevice::where('device_id', $deviceId)->exists());

        return $deviceId;
    }

    /**
     * Update an existing UW Device.
     */
    public function updateDevice(UwDevice $device, array $data): bool
    {
        return DB::transaction(function () use ($device, $data) {
            $success = $device->update($data);

            Log::info('UW Device updated via Service:', [
                'id' => $device->id,
                'device_id' => $device->device_id,
            ]);

            return $success;
        });
    }

    /**
     * Verify a device and update its heartbeat.
     */
    public function verifyAndHeartbeat(string $deviceId, ?string $token): ?UwDevice
    {
        $device = UwDevice::where('device_id', $deviceId)
            ->where('api_token', $token)
            ->where('status', 'active')
            ->first();

        if ($device) {
            $device->update(['last_seen_at' => now()]);
        }

        return $device;
    }

    /**
     * Get a device by ID without token check (for internal use cases).
     */
    public function getDeviceById(string $deviceId): ?UwDevice
    {
        return UwDevice::where('device_id', $deviceId)->first();
    }
}
