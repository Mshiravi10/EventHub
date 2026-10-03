<?php

namespace Database\Factories;

use App\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startsAt = fake()->dateTimeBetween('+2 days', '+2 months');

        return [
            'title' => fake()->sentence(4),
            'slug' => Str::lower(fake()->unique()->bothify('event-####-????')),
            'description' => fake()->paragraph(),
            'location' => fake()->city(),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+1 day'),
            'capacity' => fake()->numberBetween(40, 500),
            'status' => 'published',
        ];
    }
}
