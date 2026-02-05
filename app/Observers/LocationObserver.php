<?php

namespace App\Observers;

use App\Models\Locations;
use Illuminate\Support\Facades\Cache;

class LocationObserver
{
    public function created(Locations $location): void
    {
        $this->clearCache();
    }

    public function updated(Locations $location): void
    {
        $this->clearCache();
    }

    public function deleted(Locations $location): void
    {
        $this->clearCache();
    }

    public function restored(Locations $location): void
    {
        $this->clearCache();
    }

    public function forceDeleted(Locations $location): void
    {
        $this->clearCache();
    }

    protected function clearCache(): void
    {
        Cache::tags(['locations'])->flush();
    }
}
