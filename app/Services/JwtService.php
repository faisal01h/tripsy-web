<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

class JwtService
{
    public function issueToken(User $user): string
    {
        $issuedAt = CarbonImmutable::now();
        $expiresAt = $issuedAt->addMinutes((int) config('jwt.ttl', 60));

        $claims = [
            'iss' => (string) config('jwt.issuer', config('app.url')),
            'sub' => (string) $user->id,
            'iat' => $issuedAt->timestamp,
            'nbf' => $issuedAt->timestamp,
            'exp' => $expiresAt->timestamp,
            'jti' => (string) Str::uuid(),
        ];

        return $this->encode($claims);
    }

    /**
     * @return array{iss:string,sub:string,iat:int,nbf:int,exp:int,jti:string}
     */
    public function validateToken(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new RuntimeException('Malformed token.');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        $header = json_decode($this->base64UrlDecode($encodedHeader), true);
        $payload = json_decode($this->base64UrlDecode($encodedPayload), true);

        if (! is_array($header) || ! is_array($payload)) {
            throw new RuntimeException('Invalid token encoding.');
        }

        if (($header['alg'] ?? null) !== 'HS256' || ($header['typ'] ?? null) !== 'JWT') {
            throw new RuntimeException('Unsupported token header.');
        }

        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', $encodedHeader.'.'.$encodedPayload, $this->secret(), true),
        );

        if (! hash_equals($expectedSignature, $encodedSignature)) {
            throw new RuntimeException('Invalid token signature.');
        }

        foreach (['iss', 'sub', 'iat', 'nbf', 'exp', 'jti'] as $claimKey) {
            if (! array_key_exists($claimKey, $payload)) {
                throw new RuntimeException('Missing required claim: '.$claimKey);
            }
        }

        $now = CarbonImmutable::now()->timestamp;
        $leeway = (int) config('jwt.leeway', 30);

        if (($payload['nbf'] - $leeway) > $now) {
            throw new RuntimeException('Token is not valid yet.');
        }

        if (($payload['exp'] + $leeway) < $now) {
            throw new RuntimeException('Token has expired.');
        }

        if ((string) $payload['iss'] !== (string) config('jwt.issuer', config('app.url'))) {
            throw new RuntimeException('Invalid token issuer.');
        }

        if ($this->isRevoked((string) $payload['jti'])) {
            throw new RuntimeException('Token has been revoked.');
        }

        return [
            'iss' => (string) $payload['iss'],
            'sub' => (string) $payload['sub'],
            'iat' => (int) $payload['iat'],
            'nbf' => (int) $payload['nbf'],
            'exp' => (int) $payload['exp'],
            'jti' => (string) $payload['jti'],
        ];
    }

    /**
     * @param  array{exp:int,jti:string}  $claims
     */
    public function revokeToken(array $claims): void
    {
        $expiresAt = CarbonImmutable::createFromTimestamp($claims['exp']);

        if ($expiresAt->isPast()) {
            return;
        }

        Cache::put($this->revokedCacheKey($claims['jti']), true, $expiresAt);
    }

    private function encode(array $claims): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $encodedHeader = $this->base64UrlEncode((string) json_encode($header, JSON_THROW_ON_ERROR));
        $encodedPayload = $this->base64UrlEncode((string) json_encode($claims, JSON_THROW_ON_ERROR));
        $signature = hash_hmac('sha256', $encodedHeader.'.'.$encodedPayload, $this->secret(), true);

        return $encodedHeader.'.'.$encodedPayload.'.'.$this->base64UrlEncode($signature);
    }

    private function secret(): string
    {
        $secret = (string) config('jwt.secret', '');

        if ($secret === '') {
            throw new RuntimeException('JWT secret is not configured.');
        }

        if (str_starts_with($secret, 'base64:')) {
            return base64_decode(substr($secret, 7), true) ?: $secret;
        }

        return $secret;
    }

    private function revokedCacheKey(string $jti): string
    {
        return 'jwt:revoked:'.$jti;
    }

    private function isRevoked(string $jti): bool
    {
        return Cache::has($this->revokedCacheKey($jti));
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = strlen($value) % 4;
        if ($padding !== 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        if ($decoded === false) {
            throw new RuntimeException('Unable to decode base64url value.');
        }

        return $decoded;
    }
}
