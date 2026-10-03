<?php

namespace Database\Seeders;

use App\Models\Certificate;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\Registration;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $organizer = User::query()->updateOrCreate(
            ['email' => 'organizer@eventhub.test'],
            ['name' => 'دکتر سارا فولادی', 'role' => 'organizer', 'password' => Hash::make('password')],
        );

        $participant = User::query()->updateOrCreate(
            ['email' => 'participant@eventhub.test'],
            ['name' => 'مریم شریفی', 'role' => 'participant', 'password' => Hash::make('password')],
        );

        $event = Event::query()->updateOrCreate(
            ['slug' => 'national-science-summit-1405'],
            [
                'title' => 'همایش ملی آینده علم و فناوری',
                'description' => 'رویدادی برای گفت‌وگوی پژوهشگران، صنعت و دانشگاه.',
                'location' => 'مرکز همایش‌های دانشگاه تهران',
                'starts_at' => now()->addDays(12)->setTime(8, 30),
                'ends_at' => now()->addDays(13)->setTime(18, 0),
                'capacity' => 420,
                'status' => 'published',
            ],
        );

        $sessions = collect([
            ['title' => 'افتتاحیه و سخنرانی کلیدی', 'type' => 'keynote', 'instructor_name' => 'دکتر نادر فرهمند', 'room' => 'سالن اصلی', 'starts_at' => now()->addDays(12)->setTime(9, 0), 'ends_at' => now()->addDays(12)->setTime(10, 30), 'capacity' => 420, 'registered_count' => 316],
            ['title' => 'کارگاه کاربردهای هوش مصنوعی', 'type' => 'workshop', 'instructor_name' => 'دکتر لیلا رستگار', 'room' => 'تالار نوآوری', 'starts_at' => now()->addDays(12)->setTime(11, 0), 'ends_at' => now()->addDays(12)->setTime(13, 0), 'capacity' => 80, 'registered_count' => 63],
            ['title' => 'پنل داده و سیاست‌گذاری علمی', 'type' => 'panel', 'instructor_name' => 'دکتر پیمان کیانی', 'room' => 'سالن ابن‌سینا', 'starts_at' => now()->addDays(12)->setTime(14, 0), 'ends_at' => now()->addDays(12)->setTime(15, 30), 'capacity' => 150, 'registered_count' => 118],
            ['title' => 'شبکه‌سازی پژوهش و صنعت', 'type' => 'networking', 'instructor_name' => 'دکتر مهتاب زمانی', 'room' => 'فضای تعامل', 'starts_at' => now()->addDays(13)->setTime(10, 0), 'ends_at' => now()->addDays(13)->setTime(11, 30), 'capacity' => 120, 'registered_count' => 86],
        ])->map(fn (array $session) => EventSession::query()->updateOrCreate(
            ['event_id' => $event->id, 'title' => $session['title']],
            $session,
        ));

        $registration = Registration::query()->updateOrCreate(
            ['user_id' => $participant->id, 'event_id' => $event->id, 'event_session_id' => null],
            ['registration_code' => 'EVT-FA1405A', 'status' => 'confirmed', 'attendance_status' => 'attended', 'checked_in_at' => now()->subHours(2)],
        );

        foreach ([
            ['title' => 'بن پذیرایی روز اول', 'type' => 'food', 'code' => 'FOOD-1405-01', 'status' => 'redeemed', 'redeemed_at' => now()->subHour()],
            ['title' => 'بن پذیرایی روز دوم', 'type' => 'food', 'code' => 'FOOD-1405-02', 'status' => 'active'],
            ['title' => 'ورود به کارگاه هوش مصنوعی', 'type' => 'workshop', 'code' => 'WS-AI-1405', 'status' => 'active', 'event_session_id' => $sessions[1]->id],
            ['title' => 'بسته یادبود رویداد', 'type' => 'gift', 'code' => 'GIFT-1405-01', 'status' => 'active'],
        ] as $voucher) {
            Voucher::query()->updateOrCreate(
                ['code' => $voucher['code']],
                array_merge(['user_id' => $participant->id, 'event_id' => $event->id, 'event_session_id' => null], $voucher),
            );
        }

        foreach ([
            ['type' => 'attendance', 'serial_number' => 'CERT-AT-1405-0001', 'status' => 'issued', 'issued_at' => now()->subMinutes(30)],
            ['type' => 'workshop', 'serial_number' => 'CERT-WS-1405-0001', 'status' => 'pending', 'event_session_id' => $sessions[1]->id],
            ['type' => 'presentation', 'serial_number' => 'CERT-PR-1405-0001', 'status' => 'pending'],
            ['type' => 'speaker', 'serial_number' => 'CERT-SP-1405-0001', 'status' => 'pending'],
        ] as $certificate) {
            Certificate::query()->updateOrCreate(
                ['serial_number' => $certificate['serial_number']],
                array_merge(['user_id' => $participant->id, 'event_id' => $event->id, 'event_session_id' => null], $certificate),
            );
        }

        $organizer->touch();
        $registration->touch();
    }
}
