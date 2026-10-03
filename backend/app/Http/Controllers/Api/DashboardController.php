<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Event;
use App\Models\Registration;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $event = Event::query()
            ->where('status', 'published')
            ->with(['sessions' => fn ($query) => $query->orderBy('starts_at')])
            ->orderBy('starts_at')
            ->firstOrFail();

        $registrations = Registration::query()->where('event_id', $event->id);
        $totalRegistrations = (clone $registrations)->count();
        $attendedRegistrations = (clone $registrations)->where('attendance_status', 'attended')->count();
        $capacity = $event->sessions->sum('capacity');
        $registeredSeats = $event->sessions->sum('registered_count');
        $vouchers = Voucher::query()->where('event_id', $event->id);
        $redeemedVouchers = (clone $vouchers)->where('status', 'redeemed')->count();
        $totalVouchers = (clone $vouchers)->count();

        return response()->json([
            'event' => $event,
            'metrics' => [
                ['label' => 'ثبت‌نام کل', 'value' => $totalRegistrations, 'detail' => 'نفر ثبت‌نام‌شده', 'tone' => 'blue'],
                ['label' => 'حضور تأییدشده', 'value' => $attendedRegistrations, 'detail' => 'نفر در محل رویداد', 'tone' => 'green'],
                ['label' => 'ظرفیت کارگاه‌ها', 'value' => $capacity ? round(($registeredSeats / $capacity) * 100) : 0, 'detail' => "$registeredSeats از $capacity صندلی", 'tone' => 'amber'],
                ['label' => 'بن‌های مصرف‌شده', 'value' => $redeemedVouchers, 'detail' => "از $totalVouchers بن فعال", 'tone' => 'violet'],
            ],
            'sessions' => $event->sessions,
            'vouchers' => $vouchers->latest()->take(5)->get(),
            'certificates' => Certificate::query()->where('event_id', $event->id)->latest()->take(5)->get(),
            'notices' => [
                ['title' => 'آماده‌سازی گواهی‌ها', 'body' => 'گواهی شرکت پس از ثبت حضور برای شرکت‌کنندگان صادر می‌شود.', 'tone' => 'blue'],
                ['title' => 'درگاه حضور و غیاب فعال است', 'body' => 'کد ورود شرکت‌کنندگان را در پنل حضور و غیاب اسکن کنید.', 'tone' => 'green'],
            ],
        ]);
    }
}
