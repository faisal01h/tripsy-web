<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\Trip;
use App\Models\TripExpense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard_with_summary_data(): void
    {
        $user = User::factory()->create();
        $hostedTripMember = User::factory()->create();
        $pastTripHost = User::factory()->create();

        $upcomingTrip = Trip::factory()->create([
            'host_user_id' => $user->id,
            'name' => 'Tokyo Food Week',
            'destination' => 'Tokyo',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
        ]);
        $upcomingTrip->members()->syncWithoutDetaching([
            $user->id => ['joined_at' => now()],
            $hostedTripMember->id => ['joined_at' => now()],
        ]);

        TripExpense::factory()->create([
            'trip_id' => $upcomingTrip->id,
            'created_by_user_id' => $user->id,
            'paid_by_user_id' => $user->id,
            'title' => 'Ramen Tasting',
        ]);

        $pastTrip = Trip::factory()->create([
            'host_user_id' => $pastTripHost->id,
            'name' => 'Old Weekend',
            'start_date' => now()->subDays(10)->toDateString(),
            'end_date' => now()->subDays(5)->toDateString(),
        ]);
        $pastTrip->members()->syncWithoutDetaching([
            $user->id => ['joined_at' => now()],
            $pastTripHost->id => ['joined_at' => now()],
        ]);

        Friendship::factory()->accepted()->create([
            'user_id' => $user->id,
            'friend_id' => User::factory()->create()->id,
        ]);
        Friendship::factory()->accepted()->create([
            'user_id' => User::factory()->create()->id,
            'friend_id' => $user->id,
        ]);
        Friendship::factory()->create([
            'user_id' => User::factory()->create()->id,
            'friend_id' => $user->id,
        ]);
        Friendship::factory()->create([
            'user_id' => $user->id,
            'friend_id' => User::factory()->create()->id,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.total_trips', 2)
                ->where('stats.hosting_trips', 1)
                ->where('stats.upcoming_trips', 1)
                ->where('stats.accepted_friends', 2)
                ->where('stats.incoming_requests', 1)
                ->where('stats.outgoing_requests', 1)
                ->where('nextTrip.id', $upcomingTrip->id)
                ->where('nextTrip.name', 'Tokyo Food Week')
                ->has('recentTrips', 2)
                ->where('recentTrips.0.id', $upcomingTrip->id)
                ->where('recentTrips.0.members_count', 2)
                ->where('recentTrips.0.expenses_count', 1)
                ->where('recentTrips.0.is_host', true));
    }
}
