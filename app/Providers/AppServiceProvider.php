<?php

namespace App\Providers;

use App\Services\TextBeeService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register services
        $this->app->singleton(TextBeeService::class, function ($app) {
            return new TextBeeService(
                config('services.textbee.api_key'),
                config('services.textbee.device_id')
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Observers
        \App\Models\PublicPost::observe(\App\Observers\PublicPostObserver::class);
        \App\Models\Contact::observe(\App\Observers\ContactObserver::class);
        \App\Models\UwDevice::observe(\App\Observers\UwDeviceObserver::class);
        \App\Models\cctvDevices::observe(\App\Observers\CctvDeviceObserver::class);

        // Force HTTPS if the environment is NOT local
        if (! app()->environment('local')) {
            URL::forceScheme('https');
        }

        // Define Rate Limiter for Concern Submissions
        RateLimiter::for('concerns.submit', function (Request $request) {
            $key = $request->user()?->id ? 'user:'.$request->user()->id : 'ip:'.$request->ip();

            return [
                Limit::perMinute(3)->by($key)->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Too many submissions. Please wait before reporting again.',
                    ], 429);
                }),
                Limit::perHour(30)->by($key),
            ];
        });
    }
}
