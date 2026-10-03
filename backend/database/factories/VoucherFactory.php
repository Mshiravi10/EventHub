<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Voucher>
 */
class VoucherFactory extends Factory
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
            'type' => 'food',
            'title' => fake()->sentence(3),
            'code' => 'VCH-'.Str::upper(fake()->unique()->bothify('########')),
            'status' => 'active',
            'redeemed_at' => null,
        ];
    }
}
