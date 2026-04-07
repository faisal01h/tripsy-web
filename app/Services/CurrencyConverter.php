<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CurrencyConverter
{
    public function convert(float $amount, string $fromCurrency, string $toCurrency): float
    {
        $rate = $this->rate($fromCurrency, $toCurrency);

        return round($amount * $rate, 2);
    }

    public function rate(string $fromCurrency, string $toCurrency): float
    {
        $sourceCurrency = strtoupper($fromCurrency);
        $targetCurrency = strtoupper($toCurrency);

        if ($sourceCurrency === $targetCurrency) {
            return 1.0;
        }

        $cacheKey = sprintf('currency-rate:%s:%s', $sourceCurrency, $targetCurrency);

        return Cache::remember($cacheKey, now()->addHour(), function () use ($sourceCurrency, $targetCurrency): float {
            $response = Http::timeout(8)
                ->acceptJson()
                ->get(sprintf('https://open.er-api.com/v6/latest/%s', $sourceCurrency));

            if (! $response->ok()) {
                throw new RuntimeException('Unable to fetch currency rates.');
            }

            $rates = $response->json('rates');

            if (! is_array($rates) || ! isset($rates[$targetCurrency])) {
                throw new RuntimeException('Unsupported currency conversion.');
            }

            return (float) $rates[$targetCurrency];
        });
    }
}
