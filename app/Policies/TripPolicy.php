<?php

namespace App\Policies;

use App\Models\Trip;
use App\Models\User;

class TripPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->exists;
    }

    public function view(User $user, Trip $trip): bool
    {
        return $trip->isHost($user) || $trip->hasMember($user);
    }

    public function create(User $user): bool
    {
        return $user->exists;
    }

    public function update(User $user, Trip $trip): bool
    {
        return $trip->isHost($user);
    }

    public function delete(User $user, Trip $trip): bool
    {
        return $trip->isHost($user);
    }

    public function manageMembers(User $user, Trip $trip): bool
    {
        return $trip->isHost($user);
    }

    public function addItinerary(User $user, Trip $trip): bool
    {
        if ($trip->isHost($user)) {
            return true;
        }

        return $trip->members_can_edit_entries && $trip->hasMember($user);
    }

    public function addExpense(User $user, Trip $trip): bool
    {
        if ($trip->isHost($user)) {
            return true;
        }

        return $trip->members_can_edit_entries && $trip->hasMember($user);
    }
}
