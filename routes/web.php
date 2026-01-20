<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('users', function () {
        return Inertia::render('users');
    })->name('users');

    Route::get('system-settings', [\App\Http\Controllers\Operator\SystemSettingController::class, 'index'])->name('system-settings.index');
    Route::patch('system-settings', [\App\Http\Controllers\Operator\SystemSettingController::class, 'update'])->name('system-settings.update');

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/Operator/location.php';
require __DIR__.'/Operator/user.php';
require __DIR__.'/Operator/report.php';
require __DIR__.'/Operator/role.php';
require __DIR__.'/Operator/public-post.php';
require __DIR__.'/Operator/devices.php';
require __DIR__.'/Operator/contacts.php';
