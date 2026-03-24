<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $allowedIps = collect(explode(',', (string) env('YOLO_ALLOWED_IPS', '')))
            ->map(fn (string $ip) => trim($ip))
            ->filter()
            ->values();

        if ($allowedIps->isNotEmpty() && ! $allowedIps->contains($request->ip())) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Source IP is not allowed.',
            ], 403);
        }

        $apiKey = $request->header('x-api-key');
        $validApiKey = config('services.yolo_api_key');

        // Check if API key is provided and valid
        if (! $apiKey || $apiKey !== $validApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Invalid or missing API key.',
            ], 401);
        }

        return $next($request);
    }
}
