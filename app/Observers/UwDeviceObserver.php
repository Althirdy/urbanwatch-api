<?php

namespace App\Observers;

use App\Models\UwDevice;
use Illuminate\Support\Facades\Cache;

class UwDeviceObserver
{
    public function created(UwDevice $device): void
    {
        $this->clearCache();
    }

    public function updated(UwDevice $device): void
    {
        $this->clearCache();
    }

    public function deleted(UwDevice $device): void
    {
        $this->clearCache();
    }

    public function restored(UwDevice $device): void
    {
        $this->clearCache();
    }

    public function forceDeleted(UwDevice $device): void
    {
        $this->clearCache();
    }

    protected function clearCache(): void
    {
        Cache::forget('devices_list_latest');
    }
}
