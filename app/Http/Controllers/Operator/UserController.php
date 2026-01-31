<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\UserRequest;
use App\Models\CitizenDetails;
use App\Models\Locations;
use App\Models\OfficialsDetails;
use App\Models\Roles;
use App\Models\User;
use App\Models\UserSuspension;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $query = User::with(['role', 'officialDetails.purok:id,name', 'citizenDetails'])
            ->where('id', '!=', auth()->id()); // Exclude logged-in user

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('email', 'like', "%{$searchTerm}%")
                    ->orWhereHas('officialDetails', function ($officialQuery) use ($searchTerm) {
                        $officialQuery->where('first_name', 'like', "%{$searchTerm}%")
                            ->orWhere('last_name', 'like', "%{$searchTerm}%")
                            ->orWhere('contact_number', 'like', "%{$searchTerm}%");
                    })
                    ->orWhereHas('citizenDetails', function ($citizenQuery) use ($searchTerm) {
                        $citizenQuery->where('first_name', 'like', "%{$searchTerm}%")
                            ->orWhere('last_name', 'like', "%{$searchTerm}%")
                            ->orWhere('phone_number', 'like', "%{$searchTerm}%")
                            ->orWhere('barangay', 'like', "%{$searchTerm}%");
                    });
            });
        }

        // Filter by role
        if ($request->has('role_id') && $request->role_id) {
            $query->where('role_id', $request->role_id);
        }

        // Filter by barangay for citizens
        if ($request->has('barangay') && $request->barangay) {
            $query->whereHas('citizenDetails', function ($citizenQuery) use ($request) {
                $citizenQuery->where('barangay', $request->barangay);
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $roles = Roles::all();
        $locations = Locations::select('id', 'location_name', 'barangay')->get();

        // Fetch Puroks with geometry and status
        $puroksRaw = \App\Models\Purok::select('id', 'name', DB::raw('ST_AsGeoJSON(boundary) as geometry'))->get();
        
        // Get IDs of puroks that already have an active leader
        $occupiedPurokIds = OfficialsDetails::where('status', 'active')
            ->whereNotNull('purok_id')
            ->pluck('purok_id')
            ->toArray();

        $puroks = $puroksRaw->map(function ($p) use ($occupiedPurokIds) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'geometry' => json_decode($p->geometry),
                'status' => in_array($p->id, $occupiedPurokIds) ? 'occupied' : 'available',
            ];
        });

        return Inertia::render('users', [
            'users' => $users,
            'roles' => $roles,
            'locations' => $locations,
            'puroks' => $puroks,
            'filters' => $request->only(['search', 'role_id', 'barangay']),
        ]);
    }

    public function create(): Response
    {
        $roles = Roles::all();

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }

    public function store(UserRequest $request)
    {
        $validated = $request->validated();
        
        // Manual capture of purok_id as it might not be in UserRequest yet
        $validated['purok_id'] = $request->input('purok_id');

        // Combine names for the user table
        $validated['name'] = trim(
            $validated['first_name'].' '.
            ($validated['middle_name'] ? $validated['middle_name'].'. ' : '').
            $validated['last_name']
        );

        // Convert role_id to integer
        $validated['role_id'] = (int) $validated['role_id'];

        DB::beginTransaction();
        try {
            // Hash the password and create basic user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role_id' => $validated['role_id'],
            ]);

            // Create role-specific details
            if ($validated['role_id'] == 1 || $validated['role_id'] == 2) {
                // Operator or Purok Leader - create OfficialsDetails
                OfficialsDetails::create([
                    'user_id' => $user->id,
                    'purok_id' => $validated['purok_id'] ?? null, // Save Purok ID
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'],
                    'last_name' => $validated['last_name'],
                    'suffix' => $validated['suffix'] ?? null,
                    'contact_number' => $validated['phone_number'] ?? '',
                    'office_address' => $validated['office_address'] ?? 'N/A',
                    'assigned_brgy' => $validated['assigned_brgy'] ?? $validated['barangay'] ?? '',
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                ]);
            } elseif ($validated['role_id'] == 3) {
                // Citizen - create CitizenDetails
                CitizenDetails::create([
                    'user_id' => $user->id,
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'],
                    'last_name' => $validated['last_name'],
                    'suffix' => $validated['suffix'],
                    'date_of_birth' => $validated['date_of_birth'],
                    'phone_number' => $validated['phone_number'],
                    'address' => $validated['address'],
                    'barangay' => $validated['barangay'],
                    'city' => $validated['city'],
                    'province' => $validated['province'],
                    'postal_code' => $validated['postal_code'],
                    'is_verified' => false, // Default to unverified
                ]);
            }

            DB::commit();

            return redirect()->route('users')
                ->with('success', 'User created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create user: '.$e->getMessage());
            \Log::error('Stack trace: '.$e->getTraceAsString());

            return back()
                ->withErrors(['error' => 'Failed to create user: '.$e->getMessage()])
                ->withInput();
        }
    }

    public function show(User $user): Response
    {
        $user->load(['role', 'officialDetails', 'citizenDetails']);

        return Inertia::render('Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load(['role', 'officialDetails', 'citizenDetails']);
        $roles = Roles::all();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(UserRequest $request, User $user)
    {
        $validated = $request->validated();
        $validated['purok_id'] = $request->input('purok_id');

        // Combine names for the user table
        $validated['name'] = trim(
            $validated['first_name'].' '.
            ($validated['middle_name'] ? $validated['middle_name'].' ' : '').
            $validated['last_name']
        );

        DB::beginTransaction();
        try {
            // Update basic user info
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role_id' => $validated['role_id'] ?? $user->role_id,
            ]);

            // Update role-specific details
            if ($user->role_id == 1 || $user->role_id == 2) {
                // Operator or Purok Leader - update OfficialsDetails
                $assignedBrgy = $validated['assigned_brgy'] ?? $validated['barangay'] ?? null;

                $officialDetails = $user->officialDetails()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'purok_id' => $validated['purok_id'] ?? null, // Update Purok ID
                        'first_name' => $validated['first_name'],
                        'middle_name' => $validated['middle_name'],
                        'last_name' => $validated['last_name'],
                        'suffix' => $validated['suffix'],
                        'contact_number' => $validated['phone_number'],
                        'office_address' => $validated['office_address'],
                        'assigned_brgy' => $assignedBrgy,
                        'latitude' => $validated['latitude'],
                        'longitude' => $validated['longitude'],
                        'status' => strtolower($validated['status'] ?? 'active'),
                    ]
                );

            } elseif ($user->role_id == 3) {
                // Citizen - update CitizenDetails
                $user->citizenDetails()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'first_name' => $validated['first_name'],
                        'middle_name' => $validated['middle_name'],
                        'last_name' => $validated['last_name'],
                        'suffix' => $validated['suffix'],
                        'date_of_birth' => $validated['date_of_birth'],
                        'phone_number' => $validated['phone_number'],
                        'address' => $validated['address'],
                        'barangay' => $validated['barangay'],
                        'city' => $validated['city'],
                        'province' => $validated['province'],
                        'postal_code' => $validated['postal_code'],
                        'is_verified' => $validated['is_verified'] ?? false,
                        'status' => strtolower($validated['status'] ?? 'active'),
                    ]
                );
            }

            DB::commit();

            return redirect()->route('users')
                ->with('success', 'User updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->with('error', 'Failed to update user. Please try again.')
                ->withInput();
        }
    }

    public function archive(User $user)
    {
        try {
            DB::beginTransaction();
            try {
                // Archive user by updating status in the respective details table
                if ($user->role_id == 1 || $user->role_id == 2) {
                    $user->officialDetails()->update(['status' => 'archived']);
                } elseif ($user->role_id == 3) {
                    $user->citizenDetails()->update(['status' => 'archived']);
                }

                DB::commit();

                return redirect()->route('users')
                    ->with('success', 'User archived successfully.');
            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to archive user. Please try again.');
            }
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to archive user. Please try again.');
        }
    }

    public function destroy(User $user)
    {
        try {
            DB::beginTransaction();
            try {
                // Delete related details first (cascade should handle this, but being explicit)
                $user->officialDetails()->delete();
                $user->citizenDetails()->delete();

                // Delete the user
                $user->delete();
                DB::commit();

                return redirect()->route('users')
                    ->with('success', 'User deleted successfully.');
            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to delete user. Please try again.');
            }
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to delete user. Please try again.');
        }
    }

    /**
     * Get available punishments for a user
     */
    public function getAvailablePunishments(User $user)
    {
        try {
            $availablePunishments = UserSuspension::getAvailablePunishments($user->id);

            // Get suspension history
            $suspensionHistory = UserSuspension::where('user_id', $user->id)
                ->with('suspendedBy:id,name,email')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($suspension) {
                    return [
                        'id' => $suspension->id,
                        'punishment_type' => $suspension->punishment_type,
                        'duration_days' => $suspension->duration_days,
                        'suspended_at' => $suspension->suspended_at->format('Y-m-d H:i:s'),
                        'expires_at' => $suspension->expires_at?->format('Y-m-d H:i:s'),
                        'status' => $suspension->status,
                        'reason' => $suspension->reason,
                        'suspended_by' => $suspension->suspendedBy->name,
                        'is_active' => $suspension->isActive(),
                    ];
                });

            // Check if user is currently suspended
            $isCurrentlySuspended = UserSuspension::isUserSuspended($user->id);
            $activeSuspension = UserSuspension::getActiveSuspension($user->id);

            return response()->json([
                'available_punishments' => $availablePunishments,
                'suspension_history' => $suspensionHistory,
                'is_suspended' => $isCurrentlySuspended,
                'active_suspension' => $activeSuspension ? [
                    'type' => $activeSuspension->punishment_type,
                    'expires_at' => $activeSuspension->expires_at?->format('Y-m-d H:i:s'),
                    'reason' => $activeSuspension->reason,
                ] : null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch available punishments.',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Apply suspension to a user
     */
    public function applySuspension(Request $request, User $user)
    {
        try {

            $validated = $request->validate([
                'punishment_type' => 'required|in:warning_1,warning_2,suspension',
                'reason' => 'nullable|string|max:1000',
            ]);

            \Log::info('Validation passed', ['validated' => $validated]);

            // Verify that the punishment type is allowed for this user
            $availablePunishments = UserSuspension::getAvailablePunishments($user->id);
            \Log::info('Available punishments', ['punishments' => $availablePunishments]);

            $allowedTypes = array_column($availablePunishments, 'type');
            \Log::info('Allowed types', ['allowed' => $allowedTypes, 'requested' => $validated['punishment_type']]);

            if (! in_array($validated['punishment_type'], $allowedTypes)) {
                \Log::warning('Punishment type not allowed');

                return back()->withErrors(['error' => 'This punishment type is not available for this user.']);
            }

            DB::beginTransaction();

            \Log::info('About to apply suspension');

            // Apply the suspension
            $suspension = UserSuspension::applySuspension(
                $user->id,
                $validated['punishment_type'],
                auth()->id(),
                $validated['reason'] ?? null
            );

            \Log::info('Suspension created', [
                'suspension_id' => $suspension->id,
                'suspension_data' => $suspension->toArray(),
            ]);

            // Update user status to suspended for all punishment types
            if ($user->role_id == 1 || $user->role_id == 2) {
                $updated = $user->officialDetails()->update(['status' => 'suspended']);
                \Log::info('Updated official details status', ['rows_affected' => $updated]);
            } elseif ($user->role_id == 3) {
                $updated = $user->citizenDetails()->update(['status' => 'suspended']);
                \Log::info('Updated citizen details status', ['rows_affected' => $updated]);
            }

            DB::commit();
            \Log::info('Transaction committed successfully');

            $punishmentLabel = match ($validated['punishment_type']) {
                'warning_1' => 'Warning 1 (3 days)',
                'warning_2' => 'Warning 2 (7 days)',
                'suspension' => 'Permanent Suspension',
            };

            \Log::info('About to redirect with success message');

            return redirect()->route('users')
                ->with('success', "User suspended successfully with {$punishmentLabel}.");

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed', ['errors' => $e->errors()]);
            throw $e;
        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }
            \Log::error('Suspension failed with exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors(['error' => 'Failed to apply suspension: '.$e->getMessage()]);
        }
    }

    /**
     * Revoke an active suspension
     */
    public function revokeSuspension(User $user)
    {
        try {
            $activeSuspension = UserSuspension::getActiveSuspension($user->id);

            if (! $activeSuspension) {
                return back()->with('error', 'No active suspension found for this user.');
            }

            DB::beginTransaction();
            try {
                // Mark suspension as revoked
                $activeSuspension->update(['status' => 'revoked']);

                // Restore user status
                if ($user->role_id == 1 || $user->role_id == 2) {
                    $user->officialDetails()->update(['status' => 'active']);
                } elseif ($user->role_id == 3) {
                    $user->citizenDetails()->update(['status' => 'active']);
                }

                DB::commit();

                return redirect()->route('users')
                    ->with('success', 'Suspension revoked successfully. User has been restored.');
            } catch (\Exception $e) {
                DB::rollBack();

                return back()
                    ->with('error', 'Failed to revoke suspension. Please try again.');
            }
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to revoke suspension.');
        }
    }
}
