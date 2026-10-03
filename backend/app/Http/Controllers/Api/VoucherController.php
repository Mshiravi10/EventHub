<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVoucherRequest;
use App\Models\EventSession;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $query = Voucher::query()->with(['user:id,name,email', 'event', 'session'])->latest('id');

        if ($user->isStaff() && $request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if (! $user->isStaff()) {
            $query->whereBelongsTo($user);
        }

        return response()->json($query->get());
    }

    public function store(StoreVoucherRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['event_session_id'])) {
            $session = EventSession::query()->findOrFail($data['event_session_id']);

            if ($session->event_id !== (int) $data['event_id']) {
                throw ValidationException::withMessages(['event_session_id' => 'نشست به رویداد انتخاب‌شده تعلق ندارد.']);
            }
        }

        $voucher = Voucher::query()->create([
            ...$data,
            'code' => 'VCH-'.Str::upper(Str::random(10)),
            'status' => 'active',
        ]);

        return response()->json($voucher->load(['user:id,name,email', 'event', 'session']), 201);
    }

    public function redeem(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:64']]);
        $voucher = Voucher::query()->where('code', $data['code'])->firstOrFail();

        if ($voucher->status !== 'active') {
            throw ValidationException::withMessages(['code' => 'این بن پیش‌تر مصرف یا غیرفعال شده است.']);
        }

        $voucher->update(['status' => 'redeemed', 'redeemed_at' => now()]);

        return response()->json(['message' => 'بن با موفقیت مصرف شد.', 'voucher' => $voucher->fresh(['user:id,name', 'event', 'session'])]);
    }
}
