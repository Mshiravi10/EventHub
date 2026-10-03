<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegistrationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $query = Registration::query()
            ->with(['user:id,name,email,phone', 'event', 'session'])
            ->latest('id');

        if (! $user->isStaff()) {
            $query->whereBelongsTo($user);
        }

        return response()->json($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'event_session_id' => ['nullable', 'integer', 'exists:event_sessions,id'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $registration = DB::transaction(function () use ($data, $user): Registration {
            $event = Event::query()->where('status', 'published')->lockForUpdate()->findOrFail($data['event_id']);
            $session = isset($data['event_session_id'])
                ? EventSession::query()->lockForUpdate()->findOrFail($data['event_session_id'])
                : null;

            if ($session === null) {
                $isFull = Registration::query()
                    ->where('event_id', $event->id)
                    ->whereNull('event_session_id')
                    ->count() >= $event->capacity;

                if ($isFull) {
                    throw ValidationException::withMessages(['event_id' => 'ظرفیت این رویداد تکمیل شده است.']);
                }
            } else {
                if ($session->event_id !== $event->id) {
                    throw ValidationException::withMessages(['event_session_id' => 'این نشست متعلق به رویداد انتخاب‌شده نیست.']);
                }

                if ($session->registered_count >= $session->capacity) {
                    throw ValidationException::withMessages(['event_session_id' => 'ظرفیت این نشست تکمیل شده است.']);
                }

                $hasEventRegistration = Registration::query()
                    ->whereBelongsTo($user)
                    ->where('event_id', $event->id)
                    ->whereNull('event_session_id')
                    ->exists();

                if (! $hasEventRegistration) {
                    throw ValidationException::withMessages(['event_session_id' => 'ابتدا باید در خود رویداد ثبت‌نام کنید.']);
                }
            }

            $registration = Registration::query()->firstOrCreate(
                ['user_id' => $user->id, 'event_id' => $event->id, 'event_session_id' => $session?->id],
                [
                    'registration_code' => 'EVT-'.Str::upper(Str::random(10)),
                    'status' => 'confirmed',
                    'attendance_status' => 'absent',
                ],
            );

            if ($session !== null && $registration->wasRecentlyCreated) {
                $session->increment('registered_count');
            }

            return $registration;
        });

        return response()->json($registration->load(['event', 'session']), $registration->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, Registration $registration): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isStaff() && $registration->user_id !== $user->id) {
            abort(404);
        }

        DB::transaction(function () use ($registration): void {
            $lockedRegistration = Registration::query()->lockForUpdate()->findOrFail($registration->id);

            if ($lockedRegistration->event_session_id !== null) {
                $session = EventSession::query()->lockForUpdate()->find($lockedRegistration->event_session_id);
                $session?->decrement('registered_count');
            }

            $lockedRegistration->delete();
        });

        return response()->json([], 204);
    }
}
