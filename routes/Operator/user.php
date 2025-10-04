<?php

use App\Http\Controllers\Operator\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users');
    
    Route::resource('user', UserController::class);
    Route::patch('user/{user}/archive', [UserController::class, 'archive'])->name('user.archive');
    
});