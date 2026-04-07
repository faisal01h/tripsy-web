<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\Trip;
use App\Models\TripExpense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TripManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    public function test_guests_are_redirected_to_login_for_trips_index()
    {
        $response = $this->get(route('trips.index'));

        $response->assertRedirect(route('login'));
    }

    /**
     * @return void
     */
    public function test_authenticated_user_can_create_a_trip()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post(route('trips.store'), [
                'name' => 'Seoul Eats',
                'destination' => 'Seoul',
                'members_can_edit_entries' => true,
                'default_currency' => 'IDR',
            ])
            ->assertRedirect();

        $trip = Trip::query()->first();

        $this->assertNotNull($trip);
        $this->assertSame($user->id, $trip->host_user_id);
        $this->assertSame('IDR', $trip->default_currency);
        $this->assertTrue($trip->members()->where('users.id', $user->id)->exists());
    }

    /**
     * @return void
     */
    public function test_host_can_add_only_accepted_friends_to_trip()
    {
        $host = User::factory()->create();
        $friend = User::factory()->create();
        $stranger = User::factory()->create();

        Friendship::factory()->accepted()->create([
            'user_id' => $host->id,
            'friend_id' => $friend->id,
        ]);

        $trip = Trip::factory()->create([
            'host_user_id' => $host->id,
        ]);
        $trip->members()->syncWithoutDetaching([$host->id => ['joined_at' => now()]]);

        $this->actingAs($host)
            ->post(route('trips.members.store', $trip), [
                'user_id' => $friend->id,
            ])
            ->assertRedirect();

        $this->assertTrue($trip->fresh()->members()->where('users.id', $friend->id)->exists());

        $this->actingAs($host)
            ->from(route('trips.show', $trip))
            ->post(route('trips.members.store', $trip), [
                'user_id' => $stranger->id,
            ])
            ->assertRedirect(route('trips.show', $trip))
            ->assertSessionHasErrors('user_id');

        $this->assertFalse($trip->fresh()->members()->where('users.id', $stranger->id)->exists());
    }

    /**
     * @return void
     */
    public function test_member_cannot_add_entries_when_host_permission_is_disabled()
    {
        $host = User::factory()->create();
        $member = User::factory()->create();

        $trip = Trip::factory()->create([
            'host_user_id' => $host->id,
            'members_can_edit_entries' => false,
        ]);
        $trip->members()->syncWithoutDetaching([
            $host->id => ['joined_at' => now()],
            $member->id => ['joined_at' => now()],
        ]);

        $this->actingAs($member)
            ->post(route('trips.itineraries.store', $trip), [
                'title' => 'Dinner',
            ])
            ->assertForbidden();
    }

    /**
     * @return void
     */
    public function test_member_can_add_entries_when_host_permission_is_enabled()
    {
        $host = User::factory()->create();
        $member = User::factory()->create();

        $trip = Trip::factory()->create([
            'host_user_id' => $host->id,
            'members_can_edit_entries' => true,
        ]);
        $trip->members()->syncWithoutDetaching([
            $host->id => ['joined_at' => now()],
            $member->id => ['joined_at' => now()],
        ]);

        $this->actingAs($member)
            ->post(route('trips.itineraries.store', $trip), [
                'title' => 'Cafe stop',
                'scheduled_for' => now()->toDateTimeString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('trip_itineraries', [
            'trip_id' => $trip->id,
            'created_by_user_id' => $member->id,
            'title' => 'Cafe stop',
        ]);

        $this->actingAs($member)
            ->post(route('trips.expenses.store', $trip), [
                'title' => 'Taxi',
                'amount' => 32.5,
                'currency' => 'EUR',
                'paid_by_user_id' => $member->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('trip_expenses', [
            'trip_id' => $trip->id,
            'created_by_user_id' => $member->id,
            'paid_by_user_id' => $member->id,
            'title' => 'Taxi',
            'currency' => 'EUR',
        ]);
    }

    /**
     * @return void
     */
    public function test_trip_totals_are_converted_into_trip_default_currency()
    {
        Http::fake([
            'https://open.er-api.com/v6/latest/EUR' => Http::response([
                'rates' => [
                    'USD' => 1.20,
                ],
            ]),
        ]);

        $host = User::factory()->create();
        $member = User::factory()->create();
        $trip = Trip::factory()->create([
            'host_user_id' => $host->id,
            'default_currency' => 'USD',
        ]);
        $trip->members()->syncWithoutDetaching([
            $host->id => ['joined_at' => now()],
            $member->id => ['joined_at' => now()],
        ]);

        TripExpense::factory()->create([
            'trip_id' => $trip->id,
            'created_by_user_id' => $member->id,
            'paid_by_user_id' => $member->id,
            'amount' => 50.00,
            'currency' => 'EUR',
            'title' => 'Boat Transfer',
        ]);

        $this->actingAs($host)
            ->get(route('trips.show', $trip))
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedTrip.default_currency', 'USD')
                ->where('selectedTrip.stats.total_expenses', 60)
                ->where('selectedTrip.expenses.0.currency', 'EUR')
                ->where('selectedTrip.expenses.0.amount_in_default_currency', 60));
    }

    /**
     * @return void
     */
    public function test_only_host_can_delete_trip()
    {
        $host = User::factory()->create();
        $member = User::factory()->create();
        $trip = Trip::factory()->create([
            'host_user_id' => $host->id,
        ]);
        $trip->members()->syncWithoutDetaching([
            $host->id => ['joined_at' => now()],
            $member->id => ['joined_at' => now()],
        ]);

        $this->actingAs($member)
            ->delete(route('trips.destroy', $trip))
            ->assertForbidden();

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
        ]);

        $this->actingAs($host)
            ->delete(route('trips.destroy', $trip))
            ->assertRedirect(route('trips.index'));

        $this->assertDatabaseMissing('trips', [
            'id' => $trip->id,
        ]);
    }

    /**
     * @return void
     */
    public function test_user_can_edit_expense_and_choose_split_members()
    {
        $host = User::factory()->create();
        $memberOne = User::factory()->create();
        $memberTwo = User::factory()->create();

        $trip = Trip::factory()->create([
            'host_user_id' => $host->id,
            'default_currency' => 'USD',
        ]);
        $trip->members()->syncWithoutDetaching([
            $host->id => ['joined_at' => now()],
            $memberOne->id => ['joined_at' => now()],
            $memberTwo->id => ['joined_at' => now()],
        ]);

        $expense = TripExpense::factory()->create([
            'trip_id' => $trip->id,
            'created_by_user_id' => $host->id,
            'paid_by_user_id' => $host->id,
            'amount' => 90,
            'currency' => 'USD',
            'title' => 'Group Dinner',
        ]);
        $expense->splitMembers()->sync([$host->id, $memberOne->id, $memberTwo->id]);

        $this->actingAs($host)
            ->patch(route('trips.expenses.update', [
                'trip' => $trip->id,
                'tripExpense' => $expense->id,
            ]), [
                'title' => 'Late Dinner',
                'amount' => 100,
                'currency' => 'USD',
                'paid_by_user_id' => $host->id,
                'split_user_ids' => [$host->id, $memberOne->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('trip_expenses', [
            'id' => $expense->id,
            'title' => 'Late Dinner',
            'amount' => 100,
            'currency' => 'USD',
        ]);

        $this->assertDatabaseHas('trip_expense_splits', [
            'trip_expense_id' => $expense->id,
            'user_id' => $host->id,
        ]);
        $this->assertDatabaseHas('trip_expense_splits', [
            'trip_expense_id' => $expense->id,
            'user_id' => $memberOne->id,
        ]);
        $this->assertDatabaseMissing('trip_expense_splits', [
            'trip_expense_id' => $expense->id,
            'user_id' => $memberTwo->id,
        ]);

        $this->actingAs($host)
            ->get(route('trips.show', $trip))
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedTrip.members', function (Collection $members) use ($host, $memberOne, $memberTwo): bool {
                    $memberById = collect($members)->keyBy('id');

                    return (float) $memberById[$host->id]['paid_total'] === 100.0
                        && (float) $memberById[$host->id]['owed_total'] === 50.0
                        && (float) $memberById[$memberOne->id]['owed_total'] === 50.0
                        && (float) $memberById[$memberTwo->id]['owed_total'] === 0.0;
                }));
    }

    /**
     * @return void
     */
    public function test_new_expense_defaults_split_to_all_trip_members()
    {
        $host = User::factory()->create();
        $memberOne = User::factory()->create();
        $memberTwo = User::factory()->create();

        $trip = Trip::factory()->create([
            'host_user_id' => $host->id,
            'default_currency' => 'USD',
        ]);
        $trip->members()->syncWithoutDetaching([
            $host->id => ['joined_at' => now()],
            $memberOne->id => ['joined_at' => now()],
            $memberTwo->id => ['joined_at' => now()],
        ]);

        $this->actingAs($host)
            ->post(route('trips.expenses.store', $trip), [
                'title' => 'Lunch',
                'amount' => 120,
                'currency' => 'USD',
                'paid_by_user_id' => $host->id,
            ])
            ->assertRedirect();

        /** @var TripExpense $expense */
        $expense = TripExpense::query()->latest('id')->firstOrFail();

        $this->assertEqualsCanonicalizing(
            [$host->id, $memberOne->id, $memberTwo->id],
            $expense->splitMembers()->pluck('users.id')->all(),
        );

        $this->actingAs($host)
            ->get(route('trips.show', $trip))
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedTrip.members', function (Collection $members) use ($host, $memberOne, $memberTwo): bool {
                    $memberById = collect($members)->keyBy('id');

                    return (float) $memberById[$host->id]['owed_total'] === 40.0
                        && (float) $memberById[$memberOne->id]['owed_total'] === 40.0
                        && (float) $memberById[$memberTwo->id]['owed_total'] === 40.0;
                }));
    }
}
