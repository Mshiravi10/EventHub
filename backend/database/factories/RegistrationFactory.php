<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Registration>
 */
class RegistrationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'event_id' => Event::factory(),
            'event_session_id' => null,
            'registration_code' => 'EVT-'.Str::upper(fake()->unique()->bothify('########')),
            'status' => 'confirmed',
            'attendance_status' => 'absent',
            'checked_in_at' => null,
        ];
    }
}
