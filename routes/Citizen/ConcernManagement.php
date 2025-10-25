<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::apiResource('citizen/manual-concerns', \App\Http\Controllers\Api\Citizen\Concern\ManualConcernController::class);