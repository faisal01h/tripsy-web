<?php

return [
    'provider' => env('MAP_PROVIDER', 'openstreetmap'),

    'google' => [
        'api_key' => env('GOOGLE_MAPS_API_KEY'),
    ],

    'mapbox' => [
        'public_token' => env('MAPBOX_PUBLIC_TOKEN'),
    ],
];
