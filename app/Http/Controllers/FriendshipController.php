<?php

namespace App\Http\Controllers;

use App\Http\Requests\AcceptFriendRequestRequest;
use App\Http\Requests\StoreFriendRequestRequest;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FriendshipController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('friends/index', [
            'acceptedFriends' => $this->acceptedFriends($user),
            'incomingFriendRequests' => $this->incomingFriendRequests($user),
            'outgoingFriendRequests' => $this->outgoingFriendRequests($user),
        ]);
    }

    public function store(StoreFriendRequestRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $friend = User::query()
            ->where('email', $request->string('friend_email')->lower()->toString())
            ->firstOrFail();

        if ($friend->id === $user->id) {
            throw ValidationException::withMessages([
                'friend_email' => 'You cannot send a friend request to yourself.',
            ]);
        }

        $existing = Friendship::query()
            ->where(function ($query) use ($user, $friend) {
                $query->where('user_id', $user->id)
                    ->where('friend_id', $friend->id);
            })
            ->orWhere(function ($query) use ($user, $friend) {
                $query->where('user_id', $friend->id)
                    ->where('friend_id', $user->id);
            })
            ->first();

        if ($existing !== null) {
            if ($existing->accepted_at !== null) {
                throw ValidationException::withMessages([
                    'friend_email' => 'You are already connected as friends.',
                ]);
            }

            if ($existing->friend_id === $user->id) {
                $existing->forceFill([
                    'accepted_at' => now(),
                ])->save();

                return back()->with('status', 'Friend request accepted.');
            }

            throw ValidationException::withMessages([
                'friend_email' => 'A friend request is already pending.',
            ]);
        }

        Friendship::query()->create([
            'user_id' => $user->id,
            'friend_id' => $friend->id,
        ]);

        return back()->with('status', 'Friend request sent.');
    }

    public function accept(AcceptFriendRequestRequest $request, Friendship $friendship): RedirectResponse
    {
        if ($friendship->friend_id !== $request->user()->id) {
            abort(403);
        }

        $friendship->forceFill([
            'accepted_at' => now(),
        ])->save();

        return back()->with('status', 'Friend request accepted.');
    }

    public function reject(AcceptFriendRequestRequest $request, Friendship $friendship): RedirectResponse
    {
        if ($friendship->friend_id !== $request->user()->id || $friendship->accepted_at !== null) {
            abort(403);
        }

        $friendship->delete();

        return back()->with('status', 'Friend request rejected.');
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function acceptedFriends(User $user): Collection
    {
        $sent = Friendship::query()
            ->where('user_id', $user->id)
            ->whereNotNull('accepted_at')
            ->with('friend:id,name,email')
            ->get()
            ->pluck('friend');

        $received = Friendship::query()
            ->where('friend_id', $user->id)
            ->whereNotNull('accepted_at')
            ->with('user:id,name,email')
            ->get()
            ->pluck('user');

        return $sent
            ->merge($received)
            ->filter()
            ->unique('id')
            ->sortBy('name')
            ->values()
            ->map(fn (User $friend): array => [
                'id' => $friend->id,
                'name' => $friend->name,
                'email' => $friend->email,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function incomingFriendRequests(User $user): Collection
    {
        return Friendship::query()
            ->where('friend_id', $user->id)
            ->whereNull('accepted_at')
            ->with('user:id,name,email')
            ->latest()
            ->get()
            ->map(fn (Friendship $friendship): array => [
                'id' => $friendship->id,
                'from_user_id' => $friendship->user_id,
                'from_name' => $friendship->user?->name,
                'from_email' => $friendship->user?->email,
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function outgoingFriendRequests(User $user): Collection
    {
        return Friendship::query()
            ->where('user_id', $user->id)
            ->whereNull('accepted_at')
            ->with('friend:id,name,email')
            ->latest()
            ->get()
            ->map(fn (Friendship $friendship): array => [
                'id' => $friendship->id,
                'to_user_id' => $friendship->friend_id,
                'to_name' => $friendship->friend?->name,
                'to_email' => $friendship->friend?->email,
            ]);
    }
}
