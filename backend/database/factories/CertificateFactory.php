<?php

namespace Database\Factories;

use App\Models\Certificate;
use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Certificate>
 */
class CertificateFactory extends Factory
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
            'type' => 'attendance',
            'serial_number' => 'CERT-'.Str::upper(fake()->unique()->bothify('########')),
            'status' => 'pending',
            'issued_at' => null,
        ];
    }
}
