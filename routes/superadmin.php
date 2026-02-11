<?php

use App\Http\Controllers\Superadmin\SystemSettingController;
use App\Http\Controllers\Superadmin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:operator,superadmin'])->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users');

    // Suspension routes - must be before resource routes to avoid conflicts.
    Route::get('user/{user}/available-punishments', [UserController::class, 'getAvailablePunishments'])->name('user.available-punishments');
    Route::post('user/{user}/suspend', [UserController::class, 'applySuspension'])->name('user.suspend');
    Route::patch('user/{user}/revoke-suspension', [UserController::class, 'revokeSuspension'])->name('user.revoke-suspension');

    // Operator password management routes.
    Route::get('user/{user}/operator-details', [UserController::class, 'getOperatorDetails'])->name('user.operator-details');
    Route::post('user/{user}/reset-password', [UserController::class, 'resetOperatorPassword'])->name('user.reset-password');

    Route::patch('user/{user}/archive', [UserController::class, 'archive'])->name('user.archive');
    Route::resource('user', UserController::class);
});

Route::middleware(['auth', 'verified', 'role:superadmin'])->group(function () {
    Route::get('system-settings', [SystemSettingController::class, 'index'])->name('system-settings.index');
    Route::patch('system-settings', [SystemSettingController::class, 'update'])->name('system-settings.update');
});
