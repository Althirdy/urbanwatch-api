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

        RateLimiter::for('ocr.start', function (Request $request) {
            $fingerprint = trim((string) $request->input('deviceFingerprint', ''));
            $identity = $fingerprint !== '' ? 'fp:'.$fingerprint : 'ip:'.$request->ip();

            $cooldownKey = 'ocr:start:cooldown:'.$identity;
            $minuteKey = 'ocr:start:minute:'.$identity;

            return [
                Limit::perSecond(1, 10)->by($cooldownKey)->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 10);

                    return response()->json([
                        'success' => false,
                        'code' => 'OCR_RATE_LIMITED',
                        'lock_type' => 'cooldown',
                        'seconds' => $retryAfter,
                        'message' => "Please wait {$retryAfter} second(s) before scanning another ID.",
                    ], 429, $headers);
                }),
                Limit::perMinute(12)->by($minuteKey)->response(function (Request $request, array $headers) {
                    $retryAfter = (int) ($headers['Retry-After'] ?? 60);

                    return response()->json([
                        'success' => false,
                        'code' => 'OCR_RATE_LIMITED',
                        'lock_type' => 'rate_limit',
                        'seconds' => $retryAfter,
                        'message' => "Too many ID scan attempts. Please try again in {$retryAfter} second(s).",
                    ], 429, $headers);
                }),
            ];
        });

        RateLimiter::for('yolo.ingest', function (Request $request) {
            // Prefer API key identity; fall back to caller IP.
            $identity = $request->header('x-api-key')
                ? 'key:'.substr(hash('sha256', (string) $request->header('x-api-key')), 0, 16)
                : 'ip:'.$request->ip();

            return [
                Limit::perMinute(30)->by($identity)->response(function () {
                    return response()->json([
                        'success' => false,
                        'message' => 'Too many YOLO snapshot uploads. Please retry shortly.',
                    ], 429);
                }),
            ];
        });
    }
}
