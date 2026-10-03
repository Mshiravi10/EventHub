<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class VoucherController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Voucher::query()->with(['event', 'session'])->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        return response()->json($query->get());
    }

    public function redeem(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string', 'max:64']]);
        $voucher = Voucher::query()->where('code', $data['code'])->firstOrFail();

        if ($voucher->status !== 'active') {
            throw ValidationException::withMessages(['code' => 'این بن پیش‌تر مصرف یا غیرفعال شده است.']);
        }

        $voucher->update(['status' => 'redeemed', 'redeemed_at' => now()]);

        return response()->json(['message' => 'بن با موفقیت مصرف شد.', 'voucher' => $voucher->fresh()]);
    }
}
