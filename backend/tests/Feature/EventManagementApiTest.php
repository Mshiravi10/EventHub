<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class EventManagementApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_participant_cannot_create_an_event_and_receives_403(): void
    {
        $participant = User::factory()->create();
        $token = $participant->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/events', [
            'title' => 'رویداد بدون مجوز',
            'starts_at' => '2026-12-10 09:00:00',
            'ends_at' => '2026-12-10 17:00:00',
            'capacity' => 100,
            'status' => 'draft',
        ])->assertForbidden();
    }

    public function test_organizer_creates_a_real_event(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $token = $organizer->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/events', [
            'title' => 'همایش فناوری سلامت',
            'location' => 'تهران',
            'starts_at' => '2026-12-10 09:00:00',
            'ends_at' => '2026-12-10 17:00:00',
            'capacity' => 100,
            'status' => 'published',
        ])
            ->assertCreated()
            ->assertJsonPath('title', 'همایش فناوری سلامت')
            ->assertJsonPath('status', 'published');

        $this->assertDatabaseHas('events', ['title' => 'همایش فناوری سلامت', 'capacity' => 100]);
    }
}
