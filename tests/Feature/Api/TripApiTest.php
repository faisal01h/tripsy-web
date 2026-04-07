<?php

namespace Tests\Feature\Api;

use App\Models\Trip;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TripApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_trip_via_api(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->postJson('/api/v1/trips', [
                'name' => 'Bali Surf Camp',
                'destination' => 'Bali',
                'members_can_edit_entries' => true,
                'default_currency' => 'IDR',
            ]);

        $response->assertCreated()
            ->assertJsonPath('trip.name', 'Bali Surf Camp')
            ->assertJsonPath('trip.default_currency', 'IDR')
            ->assertJsonPath('trip.host_user_id', $user->id);

        $tripId = (int) $response->json('trip.id');

        $this->assertDatabaseHas('trips', [
            'id' => $tripId,
            'host_user_id' => $user->id,
            'name' => 'Bali Surf Camp',
            'default_currency' => 'IDR',
        ]);

        $this->assertDatabaseHas('trip_members', [
            'trip_id' => $tripId,
            'user_id' => $user->id,
        ]);
    }

    public function test_non_host_cannot_delete_trip_via_api(): void
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

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($member))
            ->deleteJson('/api/v1/trips/'.$trip->id)
            ->assertForbidden();

        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
        ]);
    }

    private function tokenFor(User $user): string
    {
        return app(JwtService::class)->issueToken($user);
    }
}
