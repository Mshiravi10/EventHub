<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\StoreEventSessionRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::query()
            ->withCount(['registrations as primary_registrations_count' => fn ($registrations) => $registrations->whereNull('event_session_id')])
            ->with(['sessions' => fn ($sessions) => $sessions->orderBy('starts_at')])
            ->orderByDesc('starts_at')
            ->orderByDesc('id');

        if (! $request->user()->isStaff()) {
            $query->where('status', 'published');
        }

        return response()->json($query->get());
    }

    public function show(Request $request, Event $event): JsonResponse
    {
        if (! $request->user()->isStaff() && $event->status !== 'published') {
            abort(404);
        }

        return response()->json($event->load(['sessions' => fn ($query) => $query->with('instructor:id,name')->orderBy('starts_at')]));
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['title']);

        $event = Event::query()->create($data);

        return response()->json($event, 201);
    }

    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $event->update($request->validated());

        return response()->json($event->fresh());
    }

    public function destroy(Event $event): JsonResponse
    {
        $event->delete();

        return response()->json([], 204);
    }

    public function storeSession(StoreEventSessionRequest $request, Event $event): JsonResponse
    {
        $data = $request->validated();
        $this->validateInstructor($data);
        $session = $event->sessions()->create($data);

        return response()->json($session->load('instructor:id,name'), 201);
    }

    public function updateSession(StoreEventSessionRequest $request, Event $event, EventSession $session): JsonResponse
    {
        abort_unless($session->event_id === $event->id, 404);
        $data = $request->validated();
        $this->validateInstructor($data);
        $session->update($data);

        return response()->json($session->fresh('instructor:id,name'));
    }

    public function destroySession(Event $event, EventSession $session): JsonResponse
    {
        abort_unless($session->event_id === $event->id, 404);
        $session->delete();

        return response()->json([], 204);
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'event';
        $slug = $base;
        $suffix = 2;

        while (Event::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }

    /** @param array<string, mixed> $data */
    private function validateInstructor(array $data): void
    {
        if (! isset($data['instructor_id'])) {
            return;
        }

        $isInstructor = User::query()
            ->whereKey($data['instructor_id'])
            ->where('role', 'instructor')
            ->exists();

        if (! $isInstructor) {
            throw ValidationException::withMessages(['instructor_id' => 'کاربر انتخاب‌شده نقش مدرس ندارد.']);
        }
    }
}
