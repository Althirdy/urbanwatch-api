<?php

namespace App\Http\Controllers\Operator;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RoleController extends Controller
{

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,NULL,id,deleted_at,NULL',
                'description' => 'nullable|string|max:1000',
            ]);

            DB::beginTransaction();
            try {
                Role::create($validated);
                DB::commit();

                return redirect()->route('roles')
                    ->with('success', 'Role created successfully.');
            } catch (\Exception $e) {
                DB::rollBack();
                return back()
                    ->with('error', 'Failed to create role. Please try again.')
                    ->withInput();
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }
    }

    public function edit(Role $role)
    {
        try {
            return Inertia::render('Operator/Role/Edit', [
                'role' => $role
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to load role for editing.');
        }
    }

    public function update(Request $request, Role $role)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $role->id . ',id,deleted_at,NULL',
                'description' => 'nullable|string|max:1000',
            ]);

            DB::beginTransaction();
            try {
                $role->update($validated);
                DB::commit();

                return redirect()->route('roles')
                    ->with('success', 'Role updated successfully.');
            } catch (\Exception $e) {
                DB::rollBack();
                return back()
                    ->with('error', 'Failed to update role. Please try again.')
                    ->withInput();
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        }
    }

    public function destroy(Role $role)
    {
        try {
            DB::beginTransaction();
            try {
                $role->delete();
                DB::commit();

                return redirect()->route('roles')
                    ->with('success', 'Role deleted successfully.');
            } catch (\Exception $e) {
                DB::rollBack();
                return back()
                    ->with('error', 'Failed to delete role. Please try again.');
            }
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Failed to delete role. Please try again.');
        }
    }
}
