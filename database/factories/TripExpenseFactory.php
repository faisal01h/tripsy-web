<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\TripExpense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TripExpense>
 */
class TripExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'trip_id' => Trip::factory(),
            'created_by_user_id' => User::factory(),
            'paid_by_user_id' => User::factory(),
            'title' => fake()->words(2, true),
            'amount' => fake()->randomFloat(2, 5, 500),
            'currency' => 'USD',
            'incurred_on' => fake()->optional()->date(),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
