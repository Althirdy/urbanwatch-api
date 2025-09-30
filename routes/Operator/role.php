<?php

use App\Http\Controllers\Operator\RoleController;
use App\Models\Roles;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('roles', function () {
        $roles = Roles::withCount('users')
            ->latest()
            ->paginate(10);
        return Inertia::render('roles', ['roles' => $roles]);
    })->name('roles');

    Route::resource('role', RoleController::class);
    Route::put('role/{id}/restore', [RoleController::class, 'restore'])->name('roles.restore');
    Route::delete('role/{id}/force-delete', [RoleController::class, 'forceDelete'])->name('roles.force-delete');
});