<?php

use App\Http\Controllers\Api\V1\Operator\ContactController;
use Illuminate\Support\Facades\Route;

// Contact Routes
Route::middleware(['auth:sanctum', 'ability.access'])->group(function () {

    // CRUD operations for contacts
    Route::apiResource('contacts', ContactController::class);
});
