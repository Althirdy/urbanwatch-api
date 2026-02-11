<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAccessTokenAbility
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated via Sanctum
        $user = $request->user();
        if ($user && ! ($user->tokenCan('access-api') || $user->tokenCan('*'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token type. This endpoint requires an access token.',
            ], 403);
        }

        return $next($request);
    }
}
