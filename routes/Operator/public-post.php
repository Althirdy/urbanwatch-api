<?php

use App\Http\Controllers\Operator\PublicPostController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:operator'])->group(function () {
    Route::get('public-posts', [PublicPostController::class, 'index'])->name('public-posts');

    Route::resource('public-post', PublicPostController::class);
    Route::patch('public-post/{publicPost}/publish', [PublicPostController::class, 'publish'])->name('public-post.publish');
    Route::patch('public-post/{publicPost}/unpublish', [PublicPostController::class, 'unpublish'])->name('public-post.unpublish');
    Route::patch('public-post/{publicPost}/resolve', [PublicPostController::class, 'resolve'])->name('public-post.resolve');
});
