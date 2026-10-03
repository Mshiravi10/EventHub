<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class RegistrationApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_creates_registration_when_session_has_capacity(): void
    {
        $this->seed();
        $event = Event::query()->firstOrFail();
        $session = $event->sessions()->where('type', 'workshop')->firstOrFail();
        $participant = User::query()->where('role', 'participant')->firstOrFail();

        $response = $this->postJson('/api/registrations', [
            'user_id' => $participant->id,
            'event_id' => $event->id,
            'event_session_id' => $session->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('event_session_id', $session->id)
            ->assertJsonStructure(['id', 'registration_code', 'status']);

        $this->assertDatabaseHas('registrations', [
            'user_id' => $participant->id,
            'event_id' => $event->id,
            'event_session_id' => $session->id,
            'status' => 'confirmed',
        ]);
    }

    public function test_returns_422_when_session_capacity_is_full(): void
    {
        $this->seed();
        $event = Event::query()->firstOrFail();
        $session = $event->sessions()->where('type', 'workshop')->firstOrFail();
        $participant = User::query()->where('role', 'participant')->firstOrFail();
        $session->update(['registered_count' => $session->capacity]);

        $this->postJson('/api/registrations', [
            'user_id' => $participant->id,
            'event_id' => $event->id,
            'event_session_id' => $session->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['event_session_id']);

        $this->assertDatabaseMissing('registrations', [
            'user_id' => $participant->id,
            'event_id' => $event->id,
            'event_session_id' => $session->id,
        ]);
    }
}
