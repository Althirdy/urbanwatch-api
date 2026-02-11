<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have the required role to access this resource.',
            ], 403);
        }

        $requiredRoleIds = [];
        $requiredRoleNames = [];

        foreach ($roles as $role) {
            if (is_numeric($role)) {
                $requiredRoleIds[] = (int) $role;
            } else {
                $requiredRoleNames[] = strtolower(trim($role));
            }
        }

        $userRoleId = (int) $user->role_id;
        $hasRoleIdAccess = in_array($userRoleId, $requiredRoleIds, true);

        $hasRoleNameAccess = false;
        if (! empty($requiredRoleNames)) {
            $user->loadMissing('role:id,name');
            $userRoleName = strtolower((string) ($user->role?->name ?? ''));
            $hasRoleNameAccess = in_array($userRoleName, $requiredRoleNames, true);
        }

        if (! $hasRoleIdAccess && ! $hasRoleNameAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You do not have the required role to access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
