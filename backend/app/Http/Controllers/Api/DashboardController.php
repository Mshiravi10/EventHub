<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isStaff()) {
            return response()->json($this->staffDashboard());
        }

        if ($user->role === 'instructor') {
            return response()->json($this->instructorDashboard($user));
        }

        return response()->json($this->participantDashboard($user));
    }

    /** @return array<string, mixed> */
    private function staffDashboard(): array
    {
        $event = Event::query()
            ->with(['sessions' => fn ($query) => $query->orderBy('starts_at')->with('instructor:id,name')])
            ->withCount(['registrations as primary_registrations_count' => fn ($query) => $query->whereNull('event_session_id')])
            ->orderByDesc('starts_at')
            ->first();

        if ($event === null) {
            return $this->emptyDashboard('organizer');
        }

        $registrations = Registration::query()->where('event_id', $event->id);
        $vouchers = Voucher::query()->where('event_id', $event->id);
        $capacity = $event->sessions->sum('capacity');
        $registeredSeats = $event->sessions->sum('registered_count');

        return [
            'mode' => 'organizer',
            'event' => $event,
            'metrics' => [
                ['label' => 'ثبت‌نام کل', 'value' => $event->primary_registrations_count, 'detail' => 'نفر ثبت‌نام‌شده', 'tone' => 'blue'],
                ['label' => 'حضور تأییدشده', 'value' => (clone $registrations)->where('attendance_status', 'attended')->count(), 'detail' => 'نفر در محل رویداد', 'tone' => 'green'],
                ['label' => 'ظرفیت کارگاه‌ها', 'value' => $capacity === 0 ? 0 : round(($registeredSeats / $capacity) * 100), 'detail' => "$registeredSeats از $capacity صندلی", 'tone' => 'amber'],
                ['label' => 'بن‌های مصرف‌شده', 'value' => (clone $vouchers)->where('status', 'redeemed')->count(), 'detail' => 'بن ثبت‌شده در سامانه', 'tone' => 'violet'],
            ],
            'sessions' => $event->sessions,
            'vouchers' => $vouchers->with('user:id,name')->latest('id')->take(5)->get(),
            'certificates' => Certificate::query()->where('event_id', $event->id)->with('user:id,name')->latest('id')->take(5)->get(),
        ];
    }

    /** @return array<string, mixed> */
    private function participantDashboard(User $user): array
    {
        $registrations = $user->registrations()
            ->with(['event', 'session'])
            ->latest('id')
            ->get();

        return [
            'mode' => 'participant',
            'event' => null,
            'metrics' => [
                ['label' => 'رویدادهای من', 'value' => $registrations->whereNull('event_session_id')->count(), 'detail' => 'ثبت‌نام تأییدشده', 'tone' => 'blue'],
                ['label' => 'نشست‌های انتخاب‌شده', 'value' => $registrations->whereNotNull('event_session_id')->count(), 'detail' => 'کارگاه و نشست', 'tone' => 'green'],
                ['label' => 'بن‌های فعال', 'value' => $user->vouchers()->where('status', 'active')->count(), 'detail' => 'قابل استفاده', 'tone' => 'amber'],
                ['label' => 'گواهی‌ها', 'value' => $user->certificates()->count(), 'detail' => 'در دسترس و در حال صدور', 'tone' => 'violet'],
            ],
            'registrations' => $registrations,
            'vouchers' => $user->vouchers()->with(['event', 'session'])->latest('id')->get(),
            'certificates' => $user->certificates()->with(['event', 'session'])->latest('id')->get(),
        ];
    }

    /** @return array<string, mixed> */
    private function instructorDashboard(User $user): array
    {
        $sessions = $user->instructedSessions()
            ->with('event')
            ->withCount('registrations')
            ->orderBy('starts_at')
            ->get();

        return [
            'mode' => 'instructor',
            'event' => null,
            'metrics' => [
                ['label' => 'نشست‌های من', 'value' => $sessions->count(), 'detail' => 'نشست برنامه‌ریزی‌شده', 'tone' => 'blue'],
                ['label' => 'ثبت‌نام نشست‌ها', 'value' => $sessions->sum('registrations_count'), 'detail' => 'شرکت‌کننده', 'tone' => 'green'],
                ['label' => 'ظرفیت کل', 'value' => $sessions->sum('capacity'), 'detail' => 'صندلی برنامه‌ریزی‌شده', 'tone' => 'amber'],
                ['label' => 'حضورها', 'value' => Registration::query()->whereIn('event_session_id', $sessions->pluck('id'))->where('attendance_status', 'attended')->count(), 'detail' => 'ثبت حضور', 'tone' => 'violet'],
            ],
            'sessions' => $sessions,
        ];
    }

    /** @return array<string, mixed> */
    private function emptyDashboard(string $mode): array
    {
        return [
            'mode' => $mode,
            'event' => null,
            'metrics' => [],
            'sessions' => [],
            'vouchers' => [],
            'certificates' => [],
            'registrations' => [],
        ];
    }
}
