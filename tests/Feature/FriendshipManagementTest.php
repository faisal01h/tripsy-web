<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FriendshipManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    public function test_guests_are_redirected_from_friends_page()
    {
        $this->get(route('friends.index'))
            ->assertRedirect(route('login'));
    }

    /**
     * @return void
     */
    public function test_authenticated_user_can_view_friends_page()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('friends.index'))
            ->assertOk();
    }

    /**
     * @return void
     */
    public function test_user_can_reject_incoming_friend_request()
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $friendship = Friendship::factory()->create([
            'user_id' => $sender->id,
            'friend_id' => $receiver->id,
            'accepted_at' => null,
        ]);

        $this->actingAs($receiver)
            ->delete(route('friendships.reject', $friendship))
            ->assertRedirect();

        $this->assertDatabaseMissing('friendships', [
            'id' => $friendship->id,
        ]);
    }

    /**
     * @return void
     */
    public function test_user_cannot_reject_someone_elses_friend_request()
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $thirdUser = User::factory()->create();

        $friendship = Friendship::factory()->create([
            'user_id' => $sender->id,
            'friend_id' => $receiver->id,
            'accepted_at' => null,
        ]);

        $this->actingAs($thirdUser)
            ->delete(route('friendships.reject', $friendship))
            ->assertForbidden();
    }
}
