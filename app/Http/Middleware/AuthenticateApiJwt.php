<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiJwt
{
    public function __construct(private readonly JwtService $jwtService) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! is_string($token) || trim($token) === '') {
            return $this->unauthorized('Missing bearer token.');
        }

        try {
            $claims = $this->jwtService->validateToken($token);
        } catch (RuntimeException $exception) {
            return $this->unauthorized($exception->getMessage());
        }

        $user = User::query()->find((int) $claims['sub']);

        if ($user === null) {
            return $this->unauthorized('User not found for token subject.');
        }

        Auth::setUser($user);
        $request->setUserResolver(fn (): User => $user);
        $request->attributes->set('jwt_claims', $claims);

        return $next($request);
    }

    private function unauthorized(string $message): JsonResponse
    {
        return response()->json([
            'message' => 'Unauthenticated.',
            'error' => $message,
        ], 401);
    }
}
