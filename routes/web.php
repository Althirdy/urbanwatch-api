<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\Operator\DashboardController::class, 'index'])->name('dashboard');
    Route::post('dashboard/assign/{id}', [\App\Http\Controllers\Operator\DashboardController::class, 'assignConcern'])->name('dashboard.assign');

    Route::get('users', [\App\Http\Controllers\Operator\UserController::class, 'index'])->name('users');

    Route::get('system-settings', [\App\Http\Controllers\Operator\SystemSettingController::class, 'index'])->name('system-settings.index');
    Route::patch('system-settings', [\App\Http\Controllers\Operator\SystemSettingController::class, 'update'])->name('system-settings.update');

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/Operator/user.php';
require __DIR__.'/Operator/report.php';
require __DIR__.'/Operator/role.php';
require __DIR__.'/Operator/public-post.php';
require __DIR__.'/Operator/devices.php';
require __DIR__.'/Operator/contacts.php';
