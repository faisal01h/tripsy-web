<?php

namespace Tests\Feature\Api;

use App\Models\Friendship;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FriendshipApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_and_accept_friend_request_via_api(): void
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($sender))
            ->postJson('/api/v1/friendships', [
                'friend_email' => $receiver->email,
            ])
            ->assertCreated();

        $friendship = Friendship::query()->first();

        $this->assertNotNull($friendship);
        $this->assertSame($sender->id, $friendship->user_id);
        $this->assertSame($receiver->id, $friendship->friend_id);
        $this->assertNull($friendship->accepted_at);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($receiver))
            ->patchJson('/api/v1/friendships/'.$friendship->id.'/accept')
            ->assertOk()
            ->assertJsonPath('message', 'Friend request accepted.');

        $this->assertNotNull($friendship->fresh()?->accepted_at);
    }

    private function tokenFor(User $user): string
    {
        return app(JwtService::class)->issueToken($user);
    }
}
