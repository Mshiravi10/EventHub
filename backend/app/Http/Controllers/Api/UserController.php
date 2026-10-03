<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::query()
            ->withCount(['registrations as event_registrations_count' => fn ($query) => $query->whereNull('event_session_id')])
            ->orderBy('name')
            ->orderBy('id')
            ->get());
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'in:admin,organizer,instructor,participant'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user->update($data);

        return response()->json($user->fresh());
    }
}
