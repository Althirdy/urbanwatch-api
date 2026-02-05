<?php

namespace App\Observers;

use App\Models\cctvDevices;
use Illuminate\Support\Facades\Cache;

class CctvDeviceObserver
{
    public function created(cctvDevices $device): void
    {
        $this->clearCache();
    }

    public function updated(cctvDevices $device): void
    {
        $this->clearCache();
    }

    public function deleted(cctvDevices $device): void
    {
        $this->clearCache();
    }

    public function restored(cctvDevices $device): void
    {
        $this->clearCache();
    }

    public function forceDeleted(cctvDevices $device): void
    {
        $this->clearCache();
    }

    protected function clearCache(): void
    {
        Cache::tags(['cctv_devices'])->flush();
    }
}
