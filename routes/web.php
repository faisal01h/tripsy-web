<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FriendshipController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\TripExpenseController;
use App\Http\Controllers\TripItineraryController;
use App\Http\Controllers\TripMemberController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('trips', [TripController::class, 'index'])->name('trips.index');
    Route::post('trips', [TripController::class, 'store'])->name('trips.store');
    Route::get('trips/{trip}', [TripController::class, 'show'])->name('trips.show');
    Route::patch('trips/{trip}', [TripController::class, 'update'])->name('trips.update');
    Route::delete('trips/{trip}', [TripController::class, 'destroy'])->name('trips.destroy');

    Route::post('trips/{trip}/members', [TripMemberController::class, 'store'])->name('trips.members.store');
    Route::delete('trips/{trip}/members/{user}', [TripMemberController::class, 'destroy'])->name('trips.members.destroy');

    Route::post('trips/{trip}/itineraries', [TripItineraryController::class, 'store'])->name('trips.itineraries.store');
    Route::post('trips/{trip}/expenses', [TripExpenseController::class, 'store'])->name('trips.expenses.store');
    Route::patch('trips/{trip}/expenses/{tripExpense}', [TripExpenseController::class, 'update'])->name('trips.expenses.update');

    Route::get('friends', [FriendshipController::class, 'index'])->name('friends.index');
    Route::post('friendships', [FriendshipController::class, 'store'])->name('friendships.store');
    Route::patch('friendships/{friendship}/accept', [FriendshipController::class, 'accept'])->name('friendships.accept');
    Route::delete('friendships/{friendship}', [FriendshipController::class, 'reject'])->name('friendships.reject');
});

require __DIR__.'/settings.php';
