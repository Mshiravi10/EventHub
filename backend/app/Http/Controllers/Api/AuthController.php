<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            ...$request->safe()->only(['name', 'email', 'phone', 'organization']),
            'role' => 'participant',
            'password' => Hash::make($request->string('password')->toString()),
        ]);

        return response()->json($this->authenticatedPayload($user), 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        $throttleKey = mb_strtolower($credentials['email']).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            throw ValidationException::withMessages(['email' => 'تعداد تلاش‌های ورود زیاد است. چند دقیقه دیگر دوباره تلاش کنید.']);
        }

        $user = User::query()->where('email', $credentials['email'])->first();

        if ($user === null || ! $user->is_active || ! Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);
            throw ValidationException::withMessages(['email' => 'ایمیل یا گذرواژه صحیح نیست.']);
        }

        RateLimiter::clear($throttleKey);
        $user->tokens()->delete();

        return response()->json($this->authenticatedPayload($user));
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'با موفقیت خارج شدید.']);
    }

    /** @return array<string, mixed> */
    private function authenticatedPayload(User $user): array
    {
        return [
            'token' => $user->createToken('eventhub-web')->plainTextToken,
            'user' => $user,
        ];
    }
}
