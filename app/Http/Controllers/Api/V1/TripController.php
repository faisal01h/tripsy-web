<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTripRequest;
use App\Http\Requests\UpdateTripRequest;
use App\Models\Friendship;
use App\Models\Trip;
use App\Models\User;
use App\Services\CurrencyConverter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Throwable;

class TripController extends Controller
{
    public function __construct(private readonly CurrencyConverter $currencyConverter) {}

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $trips = $this->userTrips($user);

        return response()->json([
            'trips' => $this->formatTripSummaries($trips),
        ]);
    }

    public function show(Request $request, Trip $trip): JsonResponse
    {
        $this->authorize('view', $trip);

        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'trip' => $this->formatTrip($trip, $user),
            'accepted_friends' => $this->acceptedFriends($user),
            'incoming_friend_requests' => $this->incomingFriendRequests($user),
            'outgoing_friend_requests' => $this->outgoingFriendRequests($user),
        ]);
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $this->authorize('create', Trip::class);

        $trip = Trip::query()->create([
            'host_user_id' => $request->user()->id,
            'name' => $request->validated('name'),
            'destination' => $this->nullableString($request->validated('destination')),
            'start_date' => $request->validated('start_date'),
            'end_date' => $request->validated('end_date'),
            'members_can_edit_entries' => (bool) $request->boolean('members_can_edit_entries'),
            'default_currency' => $this->normalizeCurrency($request->validated('default_currency')),
        ]);

        $trip->members()->syncWithoutDetaching([
            $request->user()->id => [
                'joined_at' => now(),
            ],
        ]);

        return response()->json([
            'message' => 'Trip created successfully.',
            'trip' => $this->formatTrip($trip->fresh(), $request->user()),
        ], 201);
    }

    public function update(UpdateTripRequest $request, Trip $trip): JsonResponse
    {
        $this->authorize('update', $trip);

        $trip->update([
            'name' => $request->validated('name', $trip->name),
            'destination' => $this->nullableString($request->validated('destination', $trip->destination)),
            'start_date' => $request->validated('start_date', $trip->start_date),
            'end_date' => $request->validated('end_date', $trip->end_date),
            'members_can_edit_entries' => $request->has('members_can_edit_entries')
                ? (bool) $request->boolean('members_can_edit_entries')
                : $trip->members_can_edit_entries,
            'default_currency' => $request->has('default_currency')
                ? $this->normalizeCurrency($request->validated('default_currency'))
                : $trip->default_currency,
        ]);

        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'message' => 'Trip updated successfully.',
            'trip' => $this->formatTrip($trip->fresh(), $user),
        ]);
    }

    public function destroy(Trip $trip): JsonResponse
    {
        $this->authorize('delete', $trip);

        $trip->delete();

        return response()->json([
            'message' => 'Trip deleted.',
        ]);
    }

    /**
     * @return Collection<int, Trip>
     */
    private function userTrips(User $user): Collection
    {
        return $user->trips()
            ->with([
                'host:id,name',
                'members:id,name,email',
                'itineraries.creator:id,name',
                'expenses.payer:id,name',
                'expenses.splitMembers:id,name',
            ])
            ->orderByDesc('updated_at')
            ->get();
    }

    /**
     * @param  Collection<int, Trip>  $trips
     * @return Collection<int, array<string, mixed>>
     */
    private function formatTripSummaries(Collection $trips): Collection
    {
        return $trips->map(function (Trip $trip): array {
            $defaultCurrency = $this->normalizeCurrency($trip->default_currency);
            $totals = $this->calculateTripConvertedTotals($trip, $defaultCurrency);

            return [
                'id' => $trip->id,
                'name' => $trip->name,
                'destination' => $trip->destination,
                'start_date' => $trip->start_date?->toDateString(),
                'end_date' => $trip->end_date?->toDateString(),
                'host_name' => $trip->host?->name,
                'members_count' => $trip->members->count(),
                'default_currency' => $defaultCurrency,
                'total_expenses' => $totals['total_expenses'],
            ];
        })->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTrip(Trip $trip, User $user): array
    {
        $trip->loadMissing([
            'host:id,name',
            'members:id,name,email',
            'itineraries.creator:id,name',
            'expenses.payer:id,name',
            'expenses.splitMembers:id,name',
        ]);

        $defaultCurrency = $this->normalizeCurrency($trip->default_currency);
        $totals = $this->calculateTripConvertedTotals($trip, $defaultCurrency);
        $memberCount = max(1, $trip->members->count());
        $perMemberShare = round($totals['total_expenses'] / $memberCount, 2);

        return [
            'id' => $trip->id,
            'name' => $trip->name,
            'destination' => $trip->destination,
            'start_date' => $trip->start_date?->toDateString(),
            'end_date' => $trip->end_date?->toDateString(),
            'members_can_edit_entries' => $trip->members_can_edit_entries,
            'default_currency' => $defaultCurrency,
            'host_user_id' => $trip->host_user_id,
            'host_name' => $trip->host?->name,
            'permissions' => [
                'can_manage_members' => $user->can('manageMembers', $trip),
                'can_edit_trip' => $user->can('update', $trip),
                'can_add_entries' => $user->can('addItinerary', $trip),
                'can_delete_trip' => $user->can('delete', $trip),
            ],
            'stats' => [
                'total_expenses' => $totals['total_expenses'],
                'member_count' => $memberCount,
                'per_member_share' => $perMemberShare,
                'currency' => $defaultCurrency,
                'conversion_warning' => $totals['conversion_warning'],
            ],
            'members' => $trip->members
                ->sortBy('name')
                ->values()
                ->map(function (User $member) use ($totals): array {
                    $memberPaidTotal = round((float) $totals['paid_by_member']->get($member->id, 0), 2);
                    $memberOwedTotal = round((float) $totals['owed_by_member']->get($member->id, 0), 2);

                    return [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'paid_total' => $memberPaidTotal,
                        'owed_total' => $memberOwedTotal,
                        'net_balance' => round($memberPaidTotal - $memberOwedTotal, 2),
                    ];
                }),
            'itineraries' => $trip->itineraries
                ->sortBy('scheduled_for')
                ->values()
                ->map(fn ($itinerary): array => [
                    'id' => $itinerary->id,
                    'title' => $itinerary->title,
                    'scheduled_for' => $itinerary->scheduled_for?->toIso8601String(),
                    'notes' => $itinerary->notes,
                    'created_by_name' => $itinerary->creator?->name,
                ]),
            'expenses' => $trip->expenses
                ->sortByDesc('created_at')
                ->values()
                ->map(function ($expense) use ($defaultCurrency, $totals): array {
                    $currency = $this->normalizeCurrency($expense->currency);

                    return [
                        'id' => $expense->id,
                        'title' => $expense->title,
                        'amount' => (float) $expense->amount,
                        'currency' => $currency,
                        'amount_in_default_currency' => (float) $totals['converted_by_expense_id']->get($expense->id, (float) $expense->amount),
                        'default_currency' => $defaultCurrency,
                        'split_user_ids' => $expense->splitMembers->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
                        'split_member_names' => $expense->splitMembers->pluck('name')->values()->all(),
                        'incurred_on' => $expense->incurred_on?->toDateString(),
                        'notes' => $expense->notes,
                        'paid_by_user_id' => $expense->paid_by_user_id,
                        'paid_by_name' => $expense->payer?->name,
                    ];
                }),
        ];
    }

    /**
     * @return array{
     *     total_expenses: float,
     *     paid_by_member: Collection<int, float>,
     *     owed_by_member: Collection<int, float>,
     *     converted_by_expense_id: Collection<int, float>,
     *     conversion_warning: bool
     * }
     */
    private function calculateTripConvertedTotals(Trip $trip, string $defaultCurrency): array
    {
        $paidByMember = collect();
        $owedByMember = collect();
        $convertedByExpenseId = collect();
        $totalExpenses = 0.0;
        $conversionWarning = false;
        $tripMemberIds = $trip->members->pluck('id')->map(fn ($id) => (int) $id)->values();

        foreach ($trip->expenses as $expense) {
            $sourceCurrency = $this->normalizeCurrency($expense->currency);
            $originalAmount = (float) $expense->amount;

            try {
                $convertedAmount = $this->currencyConverter->convert($originalAmount, $sourceCurrency, $defaultCurrency);
            } catch (Throwable) {
                $conversionWarning = true;
                $convertedAmount = $sourceCurrency === $defaultCurrency ? round($originalAmount, 2) : $originalAmount;
            }

            $totalExpenses += $convertedAmount;
            $convertedByExpenseId->put($expense->id, $convertedAmount);

            $memberExistingTotal = (float) $paidByMember->get($expense->paid_by_user_id, 0);
            $paidByMember->put($expense->paid_by_user_id, round($memberExistingTotal + $convertedAmount, 2));

            $splitUserIds = $expense->splitMembers->pluck('id')->map(fn ($id) => (int) $id)->values();
            if ($splitUserIds->isEmpty()) {
                $splitUserIds = $tripMemberIds;
            }

            if ($splitUserIds->isNotEmpty()) {
                $splitAmount = round($convertedAmount / $splitUserIds->count(), 2);

                foreach ($splitUserIds as $splitUserId) {
                    $memberExistingOwed = (float) $owedByMember->get($splitUserId, 0);
                    $owedByMember->put($splitUserId, round($memberExistingOwed + $splitAmount, 2));
                }
            }
        }

        return [
            'total_expenses' => round($totalExpenses, 2),
            'paid_by_member' => $paidByMember,
            'owed_by_member' => $owedByMember,
            'converted_by_expense_id' => $convertedByExpenseId,
            'conversion_warning' => $conversionWarning,
        ];
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

    private function normalizeCurrency(mixed $value): string
    {
        if (! is_string($value) || trim($value) === '') {
            return 'USD';
        }

        return strtoupper(trim($value));
    }

    private function nullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
