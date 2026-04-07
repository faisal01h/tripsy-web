<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripMemberRequest;
use App\Models\Friendship;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TripMemberController extends Controller
{
    public function store(StoreTripMemberRequest $request, Trip $trip): JsonResponse
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
            ->where(function ($query) use ($trip, $memberId): void {
                $query
                    ->where(function ($innerQuery) use ($trip, $memberId): void {
                        $innerQuery->where('user_id', $trip->host_user_id)
                            ->where('friend_id', $memberId);
                    })
                    ->orWhere(function ($innerQuery) use ($trip, $memberId): void {
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

        return response()->json([
            'message' => 'Member added successfully.',
        ], 201);
    }

    public function destroy(Trip $trip, User $user): JsonResponse
    {
        $this->authorize('manageMembers', $trip);

        if ($user->id === $trip->host_user_id) {
            throw ValidationException::withMessages([
                'member' => 'The trip host cannot be removed.',
            ]);
        }

        $trip->members()->detach($user->id);

        return response()->json([
            'message' => 'Member removed successfully.',
        ]);
    }
}
