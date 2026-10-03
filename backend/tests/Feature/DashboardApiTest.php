<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_returns_dashboard_data_for_a_published_event(): void
    {
        $this->seed();

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('event.slug', 'national-science-summit-1405')
            ->assertJsonCount(4, 'metrics')
            ->assertJsonCount(4, 'sessions');
    }
}
