<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/Operator/location.php';
require __DIR__ . '/Operator/user.php';
require __DIR__ . '/Operator/report.php';
require __DIR__ . '/Operator/role.php';
require __DIR__ . '/Operator/public-post.php';
