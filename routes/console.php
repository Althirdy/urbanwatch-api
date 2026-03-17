<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule automatic publishing of scheduled posts
Schedule::command('posts:publish-scheduled')->everyMinute();

// Auto-resolve concerns waiting for citizen confirmation beyond 2 hours.
Schedule::command('concerns:auto-resolve-awaiting')->everyMinute();
