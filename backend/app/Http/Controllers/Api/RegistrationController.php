<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegistrationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'event_session_id' => ['nullable', 'integer', 'exists:event_sessions,id'],
        ]);

        $registration = DB::transaction(function () use ($data): Registration {
            $event = Event::query()->lockForUpdate()->findOrFail($data['event_id']);
            $session = isset($data['event_session_id'])
                ? EventSession::query()->lockForUpdate()->findOrFail($data['event_session_id'])
                : null;

            if ($session && $session->event_id !== $event->id) {
                throw ValidationException::withMessages(['event_session_id' => 'این نشست متعلق به رویداد انتخاب‌شده نیست.']);
            }

            if ($session && $session->registered_count >= $session->capacity) {
                throw ValidationException::withMessages(['event_session_id' => 'ظرفیت این نشست تکمیل شده است.']);
            }

            $registration = Registration::query()->firstOrCreate(
                ['user_id' => $data['user_id'], 'event_id' => $event->id, 'event_session_id' => $session?->id],
                ['registration_code' => 'EVT-'.Str::upper(Str::random(8)), 'status' => 'confirmed'],
            );

            if ($session && $registration->wasRecentlyCreated) {
                $session->increment('registered_count');
            }

            return $registration;
        });

        return response()->json($registration, 201);
    }
}
