<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate(['registration_code' => ['required', 'string', 'max:64']]);
        $registration = Registration::query()->where('registration_code', $data['registration_code'])->firstOrFail();

        if ($registration->status !== 'confirmed') {
            throw ValidationException::withMessages(['registration_code' => 'این ثبت‌نام معتبر نیست.']);
        }

        $registration->update(['attendance_status' => 'attended', 'checked_in_at' => now()]);

        return response()->json(['message' => 'حضور با موفقیت ثبت شد.', 'registration' => $registration->fresh()]);
    }
}
