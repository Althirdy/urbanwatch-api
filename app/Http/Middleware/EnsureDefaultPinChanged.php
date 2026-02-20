<?php

namespace App\Http\Middleware;

use App\Models\PurokPinLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDefaultPinChanged
{
    /**
     * Handle an incoming request.
     *
     * Blocks Purok Leaders with default (operator-generated) PINs from accessing
     * most API endpoints until they change their PIN via the mobile app.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Only check Purok Leaders (role_id = 2)
        if (! $user || $user->role_id !== 2) {
            return $next($request);
        }

        // Get the latest PIN log for this user
        $latestLog = PurokPinLog::where('purok_leader_id', $user->id)
            ->latest('created_at')
            ->first();

        // If no log exists, allow access (backward compatibility for existing users)
        if (! $latestLog) {
            return $next($request);
        }

        // If PIN is user-changed (is_default = false), allow access
        if (! $latestLog->is_default) {
            return $next($request);
        }

        // PIN is operator-generated (is_default = true)
        // Allow access to change-pin and refresh-token endpoints only
        $allowedRoutes = [
            'api/v1/purok-leader/change-pin',
            'api/v1/refresh-token',
        ];

        $currentPath = trim($request->path(), '/');

        foreach ($allowedRoutes as $route) {
            if ($currentPath === trim($route, '/')) {
                return $next($request);
            }
        }

        // Block access - user must change default PIN first
        return response()->json([
            'success' => false,
            'message' => 'You must change your default PIN before accessing this feature. Please update your PIN in Settings.',
        ], 401);
    }
}
