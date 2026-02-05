<?php

namespace App\Observers;

use App\Models\PublicPost;
use Illuminate\Support\Facades\Cache;

class PublicPostObserver
{
    /**
     * Handle the PublicPost "created" event.
     */
    public function created(PublicPost $publicPost): void
    {
        $this->clearCache();
    }

    /**
     * Handle the PublicPost "updated" event.
     */
    public function updated(PublicPost $publicPost): void
    {
        $this->clearCache();
    }

    /**
     * Handle the PublicPost "deleted" event.
     */
    public function deleted(PublicPost $publicPost): void
    {
        $this->clearCache();
    }

    /**
     * Handle the PublicPost "restored" event.
     */
    public function restored(PublicPost $publicPost): void
    {
        $this->clearCache();
    }

    /**
     * Handle the PublicPost "force deleted" event.
     */
    public function forceDeleted(PublicPost $publicPost): void
    {
        $this->clearCache();
    }

    /**
     * Clear the public posts cache.
     */
    protected function clearCache(): void
    {
        Cache::tags(['public_posts'])->flush();
    }
}
