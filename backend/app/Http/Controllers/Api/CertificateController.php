<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCertificateRequest;
use App\Models\Certificate;
use App\Models\EventSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CertificateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $query = Certificate::query()->with(['user:id,name,email', 'event', 'session'])->latest('id');

        if (! $user->isStaff()) {
            $query->whereBelongsTo($user);
        }

        return response()->json($query->get());
    }

    public function store(StoreCertificateRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['event_session_id'])) {
            $session = EventSession::query()->findOrFail($data['event_session_id']);

            if ($session->event_id !== (int) $data['event_id']) {
                throw ValidationException::withMessages(['event_session_id' => 'نشست به رویداد انتخاب‌شده تعلق ندارد.']);
            }
        }

        $certificate = Certificate::query()->create([
            ...$data,
            'serial_number' => 'CERT-'.Str::upper(Str::random(12)),
            'issued_at' => $data['status'] === 'issued' ? now() : null,
        ]);

        return response()->json($certificate->load(['user:id,name,email', 'event', 'session']), 201);
    }

    public function update(Request $request, Certificate $certificate): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:pending,issued,revoked']]);
        $certificate->update([
            'status' => $data['status'],
            'issued_at' => $data['status'] === 'issued' ? ($certificate->issued_at ?? now()) : null,
        ]);

        return response()->json($certificate->fresh(['user:id,name,email', 'event', 'session']));
    }
}
