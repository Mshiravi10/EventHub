<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $events = Event::query()
            ->withCount([
                'registrations as registrations_count' => fn ($query) => $query->whereNull('event_session_id'),
                'registrations as attendance_count' => fn ($query) => $query->where('attendance_status', 'attended'),
                'vouchers as vouchers_count',
                'vouchers as redeemed_vouchers_count' => fn ($query) => $query->where('status', 'redeemed'),
                'certificates as certificates_count',
            ])
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'events' => $events,
            'totals' => [
                'events' => $events->count(),
                'registrations' => $events->sum('registrations_count'),
                'attendance' => $events->sum('attendance_count'),
                'vouchers' => $events->sum('vouchers_count'),
                'redeemed_vouchers' => $events->sum('redeemed_vouchers_count'),
                'certificates' => $events->sum('certificates_count'),
            ],
        ]);
    }
}
