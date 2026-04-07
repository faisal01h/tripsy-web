<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\FriendshipController;
use App\Http\Controllers\Api\V1\Settings\ProfileController;
use App\Http\Controllers\Api\V1\Settings\SecurityController;
use App\Http\Controllers\Api\V1\TripController;
use App\Http\Controllers\Api\V1\TripExpenseController;
use App\Http\Controllers\Api\V1\TripItineraryController;
use App\Http\Controllers\Api\V1\TripMemberController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::prefix('auth')->group(function (): void {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
    });

    Route::middleware('auth.jwt')->group(function (): void {
        Route::prefix('auth')->group(function (): void {
            Route::get('me', [AuthController::class, 'me']);
            Route::post('logout', [AuthController::class, 'logout']);
        });

        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('trips', [TripController::class, 'index']);
        Route::post('trips', [TripController::class, 'store']);
        Route::get('trips/{trip}', [TripController::class, 'show']);
        Route::patch('trips/{trip}', [TripController::class, 'update']);
        Route::delete('trips/{trip}', [TripController::class, 'destroy']);

        Route::post('trips/{trip}/members', [TripMemberController::class, 'store']);
        Route::delete('trips/{trip}/members/{user}', [TripMemberController::class, 'destroy']);

        Route::post('trips/{trip}/itineraries', [TripItineraryController::class, 'store']);
        Route::post('trips/{trip}/expenses', [TripExpenseController::class, 'store']);
        Route::patch('trips/{trip}/expenses/{tripExpense}', [TripExpenseController::class, 'update']);

        Route::get('friends', [FriendshipController::class, 'index']);
        Route::post('friendships', [FriendshipController::class, 'store']);
        Route::patch('friendships/{friendship}/accept', [FriendshipController::class, 'accept']);
        Route::delete('friendships/{friendship}', [FriendshipController::class, 'reject']);

        Route::get('settings/profile', [ProfileController::class, 'show']);
        Route::patch('settings/profile', [ProfileController::class, 'update']);
        Route::delete('settings/profile', [ProfileController::class, 'destroy']);

        Route::get('settings/security', [SecurityController::class, 'show']);
        Route::put('settings/password', [SecurityController::class, 'update'])
            ->middleware('throttle:6,1');
    });
});
