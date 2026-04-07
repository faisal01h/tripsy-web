<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripMemberRequest;
use App\Models\Friendship;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class TripMemberController extends Controller
{
    public function store(StoreTripMemberRequest $request, Trip $trip): RedirectResponse
    {
        $this->authorize('manageMembers', $trip);

        $memberId = (int) $request->validated('user_id');

        if ($memberId === $trip->host_user_id) {
            throw ValidationException::withMessages([
                'user_id' => 'The host is already in this trip.',
            ]);
        }

        $friendshipExists = Friendship::query()
            ->whereNotNull('accepted_at')
            ->where(function ($query) use ($trip, $memberId) {
                $query
                    ->where(function ($innerQuery) use ($trip, $memberId) {
                        $innerQuery->where('user_id', $trip->host_user_id)
                            ->where('friend_id', $memberId);
                    })
                    ->orWhere(function ($innerQuery) use ($trip, $memberId) {
                        $innerQuery->where('user_id', $memberId)
                            ->where('friend_id', $trip->host_user_id);
                    });
            })
            ->exists();

        if (! $friendshipExists) {
            throw ValidationException::withMessages([
                'user_id' => 'Only accepted friends can be added to this trip.',
            ]);
        }

        $trip->members()->syncWithoutDetaching([
            $memberId => [
                'joined_at' => now(),
            ],
        ]);

        return back();
    }

    public function destroy(Trip $trip, User $user): RedirectResponse
    {
        $this->authorize('manageMembers', $trip);

        if ($user->id === $trip->host_user_id) {
            throw ValidationException::withMessages([
                'member' => 'The trip host cannot be removed.',
            ]);
        }

        $trip->members()->detach($user->id);

        return back();
    }
}
