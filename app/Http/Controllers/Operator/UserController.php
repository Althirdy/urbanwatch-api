<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\CitizenDetails;
use App\Models\OfficialsDetails;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller 
{
    public function index(Request $request): Response
    {
        $query = User::with(['role', 'officialDetails', 'citizenDetails']);

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

        return Inertia::render('users', [
            'users' => $users,
            'roles' => $roles,
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

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
                'middle_name' => 'nullable|string|max:255|regex:/^[a-zA-Z\s\'-]*$/',
                'last_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
                'suffix' => 'nullable|string|max:10',
                'email' => 'required|email:rfc,dns|max:255|unique:users',
                'phone_number' => 'nullable|regex:/^[0-9+\-\s]{10,20}$/',
                'role_id' => 'required|numeric|exists:roles,id',
                'password' => [
                    'required',
                    'string',
                    Password::min(8)->letters()->numbers()->symbols(),
                    'confirmed',
                ],
                // For citizens
                'date_of_birth' => 'nullable|date|before:today',
                'address' => 'nullable|string|max:500',
                'barangay' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:10',
                // For officials
                'office_address' => 'nullable|string|max:500',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
            ]);

            // Combine names for the user table
            $validated['name'] = trim(
                $validated['first_name'] . ' ' . 
                ($validated['middle_name'] ? $validated['middle_name'] . ' ' : '') . 
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
                        'first_name' => $validated['first_name'],
                        'middle_name' => $validated['middle_name'],
                        'last_name' => $validated['last_name'],
                        'suffix' => $validated['suffix'],
                        'contact_number' => $validated['phone_number'],
                        'office_address' => $validated['office_address'],
                        'latitude' => $validated['latitude'],
                        'longitude' => $validated['longitude'],
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
                return back()
                    ->with('error', 'Failed to create user. Please try again.')
                    ->withInput();
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
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

    public function update(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
                'middle_name' => 'nullable|string|max:255|regex:/^[a-zA-Z\s\'-]*$/',
                'last_name' => 'required|string|max:255|regex:/^[a-zA-Z\s\'-]+$/',
                'suffix' => 'nullable|string|max:10',
                'email' => 'required|email:rfc,dns|max:255|unique:users,email,' . $user->id,
                'phone_number' => 'nullable|regex:/^[0-9+\-\s]{10,20}$/',
                'role_id' => 'nullable|exists:roles,id',
                // For citizens
                'date_of_birth' => 'nullable|date|before:today',
                'address' => 'nullable|string|max:500',
                'barangay' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'postal_code' => 'nullable|string|max:10',
                'is_verified' => 'nullable|boolean',
                // For officials
                'office_address' => 'nullable|string|max:500',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
            ]);

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
                    'role_id' => $validated['role_id'] ?? $user->role_id,
                ]);

                // Update role-specific details
                if ($user->role_id == 1 || $user->role_id == 2) {
                    // Operator or Purok Leader - update OfficialsDetails
                    $user->officialDetails()->updateOrCreate(
                        ['user_id' => $user->id],
                        [
                            'first_name' => $validated['first_name'],
                            'middle_name' => $validated['middle_name'],
                            'last_name' => $validated['last_name'],
                            'suffix' => $validated['suffix'],
                            'contact_number' => $validated['phone_number'],
                            'office_address' => $validated['office_address'],
                            'latitude' => $validated['latitude'],
                            'longitude' => $validated['longitude'],
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
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }
    }

    public function archive(User $user)
    {
        try {
            DB::beginTransaction();
            try {
                // Archive user by updating status field if it exists, or use soft delete
                if ($user->status !== null) {
                    $user->update(['status' => 'Archived']);
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
}