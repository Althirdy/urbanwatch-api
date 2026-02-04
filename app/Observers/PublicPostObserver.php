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
        // Use a wildcard pattern if the driver supports it, or specific keys.
        // Since database driver doesn't support tags, we clear specific keys.
        // We might need to clear multiple pages or just the main list.
        Cache::forget('public_posts_mobile_page_1');
        // For cursor pagination, it's harder to clear specific pages.
        // We'll use a simpler approach: clear the main keys we define.
        Cache::forget('public_posts_mobile_latest');
    }
}
