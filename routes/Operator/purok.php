<?php

use App\Http\Controllers\Operator\PurokController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('puroks', [PurokController::class, 'index'])->name('puroks.index');
    Route::post('puroks', [PurokController::class, 'store'])->name('puroks.store');
    Route::put('puroks/{purok}', [PurokController::class, 'update'])->name('puroks.update');
    Route::delete('puroks/{purok}', [PurokController::class, 'destroy'])->name('puroks.destroy');
});
