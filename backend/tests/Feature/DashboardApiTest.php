<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_401_when_dashboard_token_is_missing(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }

    public function test_returns_empty_staff_dashboard_when_no_event_exists(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $token = $organizer->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('mode', 'organizer')
            ->assertJsonPath('event', null)
            ->assertJsonCount(0, 'metrics');
    }
}
