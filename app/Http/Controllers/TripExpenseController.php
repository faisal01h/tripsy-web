<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTripExpenseRequest;
use App\Http\Requests\UpdateTripExpenseRequest;
use App\Models\Trip;
use App\Models\TripExpense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class TripExpenseController extends Controller
{
    public function store(StoreTripExpenseRequest $request, Trip $trip): RedirectResponse
    {
        $this->authorize('addExpense', $trip);

        $validated = $request->validated();
        $memberIds = $trip->members()->pluck('users.id');

        $this->assertPayerBelongsToTrip((int) $validated['paid_by_user_id'], $memberIds);

        /** @var list<int> $splitUserIds */
        $splitUserIds = array_map('intval', $validated['split_user_ids'] ?? $memberIds->all());
        $this->assertSplitMembersBelongToTrip($splitUserIds, $memberIds);

        $tripExpense = $trip->expenses()->create([
            'created_by_user_id' => $request->user()->id,
            'paid_by_user_id' => (int) $validated['paid_by_user_id'],
            'title' => $validated['title'],
            'amount' => $validated['amount'],
            'currency' => $validated['currency'],
            'incurred_on' => $validated['incurred_on'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $tripExpense->splitMembers()->sync($splitUserIds);

        return back();
    }

    public function update(UpdateTripExpenseRequest $request, Trip $trip, TripExpense $tripExpense): RedirectResponse
    {
        $this->authorize('addExpense', $trip);
        $this->assertExpenseBelongsToTrip($tripExpense, $trip);

        $validated = $request->validated();
        $memberIds = $trip->members()->pluck('users.id');

        $this->assertPayerBelongsToTrip((int) $validated['paid_by_user_id'], $memberIds);

        /** @var list<int> $splitUserIds */
        $splitUserIds = array_map('intval', $validated['split_user_ids']);
        $this->assertSplitMembersBelongToTrip($splitUserIds, $memberIds);

        $tripExpense->update([
            'paid_by_user_id' => (int) $validated['paid_by_user_id'],
            'title' => $validated['title'],
            'amount' => $validated['amount'],
            'currency' => $validated['currency'],
            'incurred_on' => $validated['incurred_on'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $tripExpense->splitMembers()->sync($splitUserIds);

        return back();
    }

    private function assertExpenseBelongsToTrip(TripExpense $tripExpense, Trip $trip): void
    {
        if ($tripExpense->trip_id !== $trip->id) {
            abort(404);
        }
    }

    /**
     * @param  Collection<int, int>  $memberIds
     */
    private function assertPayerBelongsToTrip(int $paidByUserId, Collection $memberIds): void
    {
        if (! $memberIds->contains($paidByUserId)) {
            throw ValidationException::withMessages([
                'paid_by_user_id' => 'The selected payer must be a trip member.',
            ]);
        }
    }

    /**
     * @param  list<int>  $splitUserIds
     * @param  Collection<int, int>  $memberIds
     */
    private function assertSplitMembersBelongToTrip(array $splitUserIds, Collection $memberIds): void
    {
        if ($splitUserIds === []) {
            throw ValidationException::withMessages([
                'split_user_ids' => 'Please select at least one member to split this expense.',
            ]);
        }

        $invalidIds = collect($splitUserIds)->diff($memberIds)->values();

        if ($invalidIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'split_user_ids' => 'Split members must belong to this trip.',
            ]);
        }
    }
}
