<?php

namespace App\Observers;

use App\Models\Contact;
use Illuminate\Support\Facades\Cache;

class ContactObserver
{
    public function created(Contact $contact): void
    {
        $this->clearCache();
    }

    public function updated(Contact $contact): void
    {
        $this->clearCache();
    }

    public function deleted(Contact $contact): void
    {
        $this->clearCache();
    }

    public function restored(Contact $contact): void
    {
        $this->clearCache();
    }

    public function forceDeleted(Contact $contact): void
    {
        $this->clearCache();
    }

    protected function clearCache(): void
    {
        Cache::tags(['contacts'])->flush();
    }
}
