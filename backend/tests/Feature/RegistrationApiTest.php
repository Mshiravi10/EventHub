<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class RegistrationApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_creates_primary_registration_for_a_published_event(): void
    {
        $event = Event::factory()->create(['capacity' => 2]);
        $participant = User::factory()->create();
        $token = $participant->createToken('test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/registrations', [
            'event_id' => $event->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('event_id', $event->id)
            ->assertJsonStructure(['id', 'registration_code', 'status']);

        $this->assertDatabaseHas('registrations', [
            'user_id' => $participant->id,
            'event_id' => $event->id,
            'event_session_id' => null,
            'status' => 'confirmed',
        ]);
    }

    public function test_creates_session_registration_after_event_registration(): void
    {
        $event = Event::factory()->create();
        $session = EventSession::factory()->for($event)->create(['capacity' => 2]);
        $participant = User::factory()->create();
        Registration::factory()->for($participant)->for($event)->create();
        $token = $participant->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/registrations', [
            'event_id' => $event->id,
            'event_session_id' => $session->id,
        ])
            ->assertCreated()
            ->assertJsonPath('event_session_id', $session->id);

        $this->assertDatabaseHas('registrations', [
            'user_id' => $participant->id,
            'event_id' => $event->id,
            'event_session_id' => $session->id,
        ]);

        $this->assertDatabaseHas('event_sessions', ['id' => $session->id, 'registered_count' => 1]);
    }

    public function test_returns_422_when_session_capacity_is_full(): void
    {
        $event = Event::factory()->create();
        $session = EventSession::factory()->for($event)->create(['capacity' => 1, 'registered_count' => 1]);
        $participant = User::factory()->create();
        Registration::factory()->for($participant)->for($event)->create();
        $token = $participant->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/registrations', [
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
