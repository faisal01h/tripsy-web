<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JwtAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_receive_jwt_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'API User',
            'email' => 'api-user@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'message',
                'token',
                'token_type',
                'expires_in',
                'user' => ['id', 'name', 'email', 'email_verified_at'],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'api-user@example.com',
        ]);
    }

    public function test_user_can_login_and_access_protected_endpoint_with_jwt(): void
    {
        $user = User::factory()->create([
            'email' => 'tester@example.com',
            'password' => 'password',
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'tester@example.com',
            'password' => 'password',
        ]);

        $loginResponse->assertOk();

        $token = $loginResponse->json('token');
        $this->assertIsString($token);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_invalid_jwt_is_rejected(): void
    {
        $this->withHeader('Authorization', 'Bearer invalid-token')
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Unauthenticated.');
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create();

        $token = app(JwtService::class)->issueToken($user);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }
}
