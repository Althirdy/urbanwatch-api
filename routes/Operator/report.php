<?php

use App\Http\Controllers\Operator\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('reports', [ReportController::class, 'index'])->name('reports');

    Route::resource('report', ReportController::class);
    Route::patch('report/{report}/acknowledge', [ReportController::class, 'acknowledge'])->name('report.acknowledge');
    Route::patch('report/{report}/resolve', [ReportController::class, 'resolve'])->name('report.resolve');
});