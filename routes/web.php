<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified', 'role:operator'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\Operator\DashboardController::class, 'index'])->name('dashboard');
    Route::post('dashboard/assign/{id}', [\App\Http\Controllers\Operator\DashboardController::class, 'assignConcern'])->name('dashboard.assign');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/Operator/report.php';
require __DIR__.'/Operator/public-post.php';
require __DIR__.'/Operator/devices.php';
require __DIR__.'/Operator/contacts.php';
require __DIR__.'/superadmin.php';
