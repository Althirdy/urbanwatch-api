<?php

use App\Http\Controllers\Operator\ContactController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:operator'])->group(function () {
    Route::get('contacts', [ContactController::class, 'index'])->name('contacts');
    Route::post('contacts', [ContactController::class, 'store'])->name('contacts.store');
    Route::get('contacts/{contact}', [ContactController::class, 'show'])->name('contacts.show');
    Route::put('contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
    Route::delete('contacts/{contact}', [ContactController::class, 'destroy'])->name('contacts.destroy');
});
