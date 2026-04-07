<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $totalTrips = $user->trips()->count();
        $hostingTrips = $user->hostedTrips()->count();
        $upcomingTrips = $user->trips()
            ->whereDate('trips.end_date', '>=', today())
            ->count();

        $incomingRequests = Friendship::query()
            ->where('friend_id', $user->id)
            ->whereNull('accepted_at')
            ->count();

        $outgoingRequests = Friendship::query()
            ->where('user_id', $user->id)
            ->whereNull('accepted_at')
            ->count();

        $nextTrip = $user->trips()
            ->select([
                'trips.id',
                'trips.name',
                'trips.destination',
                'trips.start_date',
                'trips.end_date',
            ])
            ->whereDate('trips.end_date', '>=', today())
            ->orderBy('trips.start_date')
            ->first();

        $recentTrips = $user->trips()
            ->select([
                'trips.id',
                'trips.name',
                'trips.destination',
                'trips.start_date',
                'trips.end_date',
                'trips.host_user_id',
            ])
            ->withCount(['members', 'expenses'])
            ->orderByDesc('trips.updated_at')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'total_trips' => $totalTrips,
                'hosting_trips' => $hostingTrips,
                'upcoming_trips' => $upcomingTrips,
                'accepted_friends' => $this->acceptedFriendsCount($user),
                'incoming_requests' => $incomingRequests,
                'outgoing_requests' => $outgoingRequests,
            ],
            'nextTrip' => $nextTrip === null ? null : [
                'id' => $nextTrip->id,
                'name' => $nextTrip->name,
                'destination' => $nextTrip->destination,
                'start_date' => $nextTrip->start_date?->toDateString(),
                'end_date' => $nextTrip->end_date?->toDateString(),
            ],
            'recentTrips' => $this->formatRecentTrips($recentTrips, $user),
        ]);
    }

    private function acceptedFriendsCount(User $user): int
    {
        $friendships = Friendship::query()
            ->whereNotNull('accepted_at')
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('friend_id', $user->id);
            })
            ->get(['user_id', 'friend_id']);

        return $friendships
            ->flatMap(fn (Friendship $friendship): array => [$friendship->user_id, $friendship->friend_id])
            ->reject(fn (int $friendId): bool => $friendId === $user->id)
            ->unique()
            ->count();
    }

    /**
     * @param  Collection<int, Trip>  $trips
     * @return Collection<int, array<string, mixed>>
     */
    private function formatRecentTrips(Collection $trips, User $user): Collection
    {
        return $trips->map(fn (Trip $trip): array => [
            'id' => $trip->id,
            'name' => $trip->name,
            'destination' => $trip->destination,
            'start_date' => $trip->start_date?->toDateString(),
            'end_date' => $trip->end_date?->toDateString(),
            'members_count' => (int) $trip->members_count,
            'expenses_count' => (int) $trip->expenses_count,
            'is_host' => $trip->host_user_id === $user->id,
        ])->values();
    }
}
