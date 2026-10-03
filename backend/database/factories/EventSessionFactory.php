<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventSession>
 */
class EventSessionFactory extends Factory
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
            'event_id' => Event::factory(),
            'title' => fake()->sentence(3),
            'type' => 'workshop',
            'instructor_name' => fake()->name(),
            'room' => fake()->word(),
            'starts_at' => $startsAt,
            'ends_at' => (clone $startsAt)->modify('+2 hours'),
            'capacity' => 50,
            'registered_count' => 0,
            'attendance_required' => true,
        ];
    }
}
