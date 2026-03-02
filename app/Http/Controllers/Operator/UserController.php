<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Http\Requests\Operator\UserRequest;
use App\Models\CitizenDetails;
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
    private function normalizePhilippineMobileNumber(?string $rawPhone): ?string
    {
        if (!is_string($rawPhone) || trim($rawPhone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $rawPhone);
        if (!$digits) {
            return null;
        }

        if (str_starts_with($digits, '63') && strlen($digits) === 12) {
            $digits = '0' . substr($digits, 2);
        } elseif (str_starts_with($digits, '9') && strlen($digits) === 10) {
            $digits = '0' . $digits;
        }

        return $digits;
    }

    private function actorRoleName(): string
    {
        $user = auth()->user();
        $user?->loadMissing('role:id,name');

        return strtolower((string) ($user?->role?->name ?? ''));
    }

    private function isSuperadminActor(): bool
    {
        return $this->actorRoleName() === 'superadmin';
    }

    private function isOperatorActor(): bool
    {
        return $this->actorRoleName() === 'operator';
    }

    private function resolveRoleIdsByNames(array $names): array
    {
        return Roles::whereIn('name', $names)->pluck('id')->map(fn($id) => (int) $id)->all();
    }

    private function allowedIndexRoleIds(): array
    {
        if ($this->isSuperadminActor()) {
            return $this->resolveRoleIdsByNames(['Operator']);
        }

        if ($this->isOperatorActor()) {
            return $this->resolveRoleIdsByNames(['Purok Leader', 'Citizen']);
        }

        return [];
    }

    private function allowedCreateRoleIds(): array
    {
        if ($this->isSuperadminActor()) {
            return $this->resolveRoleIdsByNames(['Operator']);
        }

        if ($this->isOperatorActor()) {
            return $this->resolveRoleIdsByNames(['Purok Leader']);
        }

        return [];
    }

    private function allowedEditableTargetRoleIds(): array
    {
        if ($this->isSuperadminActor()) {
            return $this->resolveRoleIdsByNames(['Operator']);
        }

        if ($this->isOperatorActor()) {
            return $this->resolveRoleIdsByNames(['Purok Leader']);
        }

        return [];
    }

    private function ensureCanCreateRole(int $roleId): void
    {
        if (!in_array($roleId, $this->allowedCreateRoleIds(), true)) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function ensureCanEditUser(User $user): void
    {
        if (!in_array((int) $user->role_id, $this->allowedEditableTargetRoleIds(), true)) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function ensureCanViewUser(User $user): void
    {
        if (!in_array((int) $user->role_id, $this->allowedIndexRoleIds(), true)) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function ensureOperatorCitizenSuspensionPermission(User $user): void
    {
        $user->loadMissing('role:id,name');
        $targetRole = strtolower((string) ($user->role?->name ?? ''));

        if (!$this->isOperatorActor() || $targetRole !== 'citizen') {
            abort(403, 'Unauthorized action.');
        }
    }

    private function ensureSuperadminOperatorOnly(User $user): void
    {
        $user->loadMissing('role:id,name');
        $targetRole = strtolower((string) ($user->role?->name ?? ''));

        if (!$this->isSuperadminActor() || $targetRole !== 'operator') {
            abort(403, 'Unauthorized action.');
        }
    }

    public function index(Request $request): Response
    {
        $query = User::with(['role', 'officialDetails.purok:id,name', 'citizenDetails'])
            ->where('id', '!=', auth()->id())
            ->whereIn('role_id', $this->allowedIndexRoleIds()); // Exclude logged-in user and scope by actor

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

        $roles = Roles::whereIn('id', $this->allowedCreateRoleIds())->get();

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
            'puroks' => $puroks,
            'filters' => $request->only(['search', 'role_id', 'barangay']),
        ]);
    }

    public function create(): Response
    {
        $roles = Roles::whereIn('id', $this->allowedCreateRoleIds())->get();

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
            $validated['first_name'] . ' ' .
            ($validated['middle_name'] ? $validated['middle_name'] . '. ' : '') .
            $validated['last_name']
        );

        // Convert role_id to integer
        $validated['role_id'] = (int) $validated['role_id'];
        $this->ensureCanCreateRole($validated['role_id']);
        $normalizedPhone = $this->normalizePhilippineMobileNumber($validated['phone_number'] ?? null);

        $purokLeaderRoleIds = $this->resolveRoleIdsByNames(['Purok Leader']);
        $operatorRoleIds = $this->resolveRoleIdsByNames(['Operator']);
        $isPurokLeader = in_array((int) $validated['role_id'], $purokLeaderRoleIds, true);
        $isOperatorOrPurokLeader = in_array((int) $validated['role_id'], array_merge($operatorRoleIds, $purokLeaderRoleIds), true);

        // Auto-generate PIN for Purok Leaders
        $generatedPin = null;
        if ($isPurokLeader) {
            $pinService = app(\App\Services\PinService::class);
            $pinData = $pinService->generateAndHashPin();
            $generatedPin = $pinData['pin']; // Store plaintext PIN to return once
            $hashedPassword = $pinData['hash']; // Use hashed version for database
        } else {
            // For other roles, hash the provided password
            $hashedPassword = Hash::make($validated['password']);
        }

        DB::beginTransaction();
        try {
            // Create basic user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $hashedPassword,
                'role_id' => $validated['role_id'],
            ]);

            // Create role-specific details
            if ($isOperatorOrPurokLeader) {
                // Operator or Purok Leader - create OfficialsDetails
                OfficialsDetails::create([
                    'user_id' => $user->id,
                    'id_number' => $validated['id_number'] ?? null,
                    'purok_id' => $validated['purok_id'] ?? null, // Save Purok ID
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'],
                    'last_name' => $validated['last_name'],
                    'suffix' => $validated['suffix'] ?? null,
                    'contact_number' => $normalizedPhone ?? '',
                    'office_address' => $validated['office_address'] ?? 'N/A',
                    'assigned_brgy' => $validated['assigned_brgy'] ?? $validated['barangay'] ?? '',
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                    'status' => 'active',
                ]);

                // For Purok Leaders, create initial PIN log entry
                if ($isPurokLeader) {
                    \App\Models\PurokPinLog::create([
                        'purok_leader_id' => $user->id,
                        'reset_by_operator_id' => auth()->id(),
                        'reason' => 'Initial account creation',
                        'is_default' => true, // Operator-generated PIN requires change on mobile
                    ]);
                }
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
                    'status' => 'active',
                ]);
            }

            DB::commit();

            // For Purok Leaders, return the generated PIN (one time only)
            if ($isPurokLeader && $generatedPin) {
                return redirect()->route('users')
                    ->with('success', 'Purok Leader created successfully.')
                    ->with('generated_pin', $generatedPin)
                    ->with('purok_leader_name', $validated['name']);
            }

            return redirect()->route('users')
                ->with('success', 'User created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create user: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());

            return back()
                ->withErrors(['error' => 'Failed to create user: ' . $e->getMessage()])
                ->withInput();
        }
    }

    public function show(User $user): Response
    {
        $this->ensureCanViewUser($user);
        $user->load(['role', 'officialDetails', 'citizenDetails']);

        return Inertia::render('Users/Show', [
            'user' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        $this->ensureCanEditUser($user);
        $user->load(['role', 'officialDetails', 'citizenDetails']);
        $roles = Roles::whereIn('id', $this->allowedCreateRoleIds())->get();

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    public function update(UserRequest $request, User $user)
    {
        $this->ensureCanEditUser($user);
        $validated = $request->validated();
        $validated['purok_id'] = $request->input('purok_id');
        $normalizedPhone = $this->normalizePhilippineMobileNumber($validated['phone_number'] ?? null);

        // Combine names for the user table
        $validated['name'] = trim(
            $validated['first_name'] . ' ' .
            ($validated['middle_name'] ? $validated['middle_name'] . ' ' : '') .
            $validated['last_name']
        );

        DB::beginTransaction();
        try {
            // Update basic user info
            $user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role_id' => $user->role_id,
            ]);

            // Update role-specific details
            if ($user->role_id == 1 || $user->role_id == 2) {
                // Operator or Purok Leader - update OfficialsDetails
                $assignedBrgy = $validated['assigned_brgy'] ?? $validated['barangay'] ?? null;

                $officialDetails = $user->officialDetails()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'id_number' => $validated['id_number'] ?? null,
                        'purok_id' => $validated['purok_id'] ?? null, // Update Purok ID
                        'first_name' => $validated['first_name'],
                        'middle_name' => $validated['middle_name'],
                        'last_name' => $validated['last_name'],
                        'suffix' => $validated['suffix'],
                        'contact_number' => $normalizedPhone ?? '',
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
        $this->ensureCanEditUser($user);
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
        $this->ensureCanEditUser($user);
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
        $this->ensureOperatorCitizenSuspensionPermission($user);
        try {
            $availablePunishments = UserSuspension::getAvailablePunishments($user->id);

            // Get suspension history
            $suspensionHistory = UserSuspension::where('user_id', $user->id)
                ->with(['suspendedBy:id,name,email', 'suspendedBy.officialDetails:user_id,first_name,middle_name,last_name'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($suspension) {
                    // Get admin name from official details if available, otherwise use user name
                    $adminName = $suspension->suspendedBy?->name ?? 'System';
                    if ($suspension->suspendedBy?->officialDetails) {
                        $details = $suspension->suspendedBy->officialDetails;
                        $adminName = trim(
                            $details->first_name . ' ' .
                            ($details->middle_name ? $details->middle_name . ' ' : '') .
                            $details->last_name
                        );
                    }

                    return [
                        'id' => $suspension->id,
                        'punishment_type' => $suspension->punishment_type,
                        'duration_days' => $suspension->duration_days,
                        'suspended_at' => $suspension->suspended_at->format('Y-m-d H:i:s'),
                        'expires_at' => $suspension->expires_at?->format('Y-m-d H:i:s'),
                        'status' => $suspension->status,
                        'reason' => $suspension->reason,
                        'suspended_by' => $adminName,
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
        $this->ensureOperatorCitizenSuspensionPermission($user);
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

            if (!in_array($validated['punishment_type'], $allowedTypes)) {
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

            return back()->withErrors(['error' => 'Failed to apply suspension: ' . $e->getMessage()]);
        }
    }

    /**
     * Revoke an active suspension
     */
    public function revokeSuspension(User $user)
    {
        $this->ensureOperatorCitizenSuspensionPermission($user);
        try {
            $activeSuspension = UserSuspension::getActiveSuspension($user->id);

            if (!$activeSuspension) {
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

    /**
     * Get operator details with password change logs
     */
    public function getOperatorDetails(User $user)
    {
        $this->ensureSuperadminOperatorOnly($user);

        $user->load(['officialDetails', 'role']);

        $passwordLogs = \App\Models\OperatorPasswordLog::where('operator_id', $user->id)
            ->with(['changedByUser.officialDetails'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'reason' => $log->reason,
                    'changed_by' => $log->changed_by_name,
                    'changed_at' => $log->created_at->format('M d, Y H:i'),
                    'changed_at_human' => $log->created_at->diffForHumans(),
                    'ip_address' => $log->ip_address,
                ];
            });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->name,
                'created_at' => $user->created_at->format('M d, Y'),
                'official_details' => $user->officialDetails ? [
                    'first_name' => $user->officialDetails->first_name,
                    'middle_name' => $user->officialDetails->middle_name,
                    'last_name' => $user->officialDetails->last_name,
                    'contact_number' => $user->officialDetails->contact_number,
                    'office_address' => $user->officialDetails->office_address,
                    'assigned_brgy' => $user->officialDetails->assigned_brgy,
                    'status' => $user->officialDetails->status,
                ] : null,
            ],
            'password_logs' => $passwordLogs,
        ]);
    }

    /**
     * Reset operator password with logging
     */
    public function resetOperatorPassword(Request $request, User $user)
    {
        $this->ensureSuperadminOperatorOnly($user);

        $request->validate([
            'new_password' => 'required|string|min:8|confirmed',
            'reason' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            // Update password
            $user->update([
                'password' => Hash::make($request->new_password),
            ]);

            // Log the password change
            \App\Models\OperatorPasswordLog::create([
                'operator_id' => $user->id,
                'changed_by' => auth()->id(),
                'action' => 'reset',
                'reason' => $request->reason,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            DB::commit();

            return back()->with('success', 'Password reset successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to reset password. Please try again.');
        }
    }

    /**
     * Reset a Purok Leader's PIN.
     * Requires operator password confirmation for security.
     * Generates a new random 4-digit PIN and invalidates existing tokens.
     */
    public function resetPurokLeaderPin(\App\Http\Requests\Operator\ResetPurokPinRequest $request, User $user)
    {
        // Ensure the target is a Purok Leader
        $purokLeaderRoleIds = $this->resolveRoleIdsByNames(['Purok Leader']);
        if (!in_array((int) $user->role_id, $purokLeaderRoleIds, true)) {
            return back()->withErrors(['error' => 'Only Purok Leader PINs can be reset using this method.']);
        }

        // Verify the operator's password
        $operator = auth()->user();
        if (!Hash::check($request->operator_password, $operator->password)) {
            return back()->withErrors(['operator_password' => 'Incorrect password. Please try again.']);
        }

        DB::beginTransaction();
        try {
            // Lock the user row to prevent concurrent changes (race condition protection)
            $userLocked = User::where('id', $user->id)->lockForUpdate()->first();

            // Generate new PIN
            $pinService = app(\App\Services\PinService::class);
            $pinData = $pinService->generateAndHashPin();
            $newPin = $pinData['pin']; // Plaintext PIN to show once
            $hashedPin = $pinData['hash']; // Hashed for database

            // Update PIN
            $userLocked->update([
                'password' => $hashedPin,
            ]);

            // Log the PIN reset
            \App\Models\PurokPinLog::create([
                'purok_leader_id' => $user->id,
                'reset_by_operator_id' => $operator->id,
                'reason' => $request->reason,
                'is_default' => true, // Operator-generated PIN requires change on mobile
            ]);

            // Invalidate all existing tokens (force re-login with new PIN)
            $userLocked->tokens()->delete();

            // TODO: Broadcast logout event to Purok Leader mobile app
            // event(new \App\Events\PurokLeaderPinReset($user));

            DB::commit();

            return back()
                ->with('success', 'PIN reset successfully.')
                ->with('reset_pin', $newPin)
                ->with('reset_purok_leader_name', $user->name);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to reset Purok Leader PIN: ' . $e->getMessage());

            return back()->with('error', 'Failed to reset PIN. Please try again.');
        }
    }
}
