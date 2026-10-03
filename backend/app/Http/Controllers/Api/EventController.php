<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Event::query()
            ->where('status', 'published')
            ->withCount('registrations')
            ->orderBy('starts_at')
            ->get());
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json($event->load(['sessions' => fn ($query) => $query->orderBy('starts_at')]));
    }
}
