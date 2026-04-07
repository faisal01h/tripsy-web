<?php

return [
    'secret' => env('JWT_SECRET', env('APP_KEY', '')),
    'issuer' => env('APP_URL', 'tripsy-web'),
    'ttl' => (int) env('JWT_TTL', 60),
    'leeway' => (int) env('JWT_LEEWAY', 30),
];
