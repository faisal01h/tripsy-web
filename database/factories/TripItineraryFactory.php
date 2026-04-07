<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\TripItinerary;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TripItinerary>
 */
class TripItineraryFactory extends Factory
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
            'title' => fake()->sentence(3),
            'scheduled_for' => fake()->optional()->dateTimeBetween('now', '+2 months'),
            'notes' => fake()->optional()->paragraph(),
        ];
    }
}
