<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::get('/dashboard', DashboardController::class);

    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event:slug}', [EventController::class, 'show']);
    Route::get('/registrations', [RegistrationController::class, 'index']);
    Route::post('/registrations', [RegistrationController::class, 'store']);
    Route::delete('/registrations/{registration}', [RegistrationController::class, 'destroy']);
    Route::get('/vouchers', [VoucherController::class, 'index']);
    Route::get('/certificates', [CertificateController::class, 'index']);

    Route::middleware('role:admin,organizer')->group(function (): void {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
        Route::post('/events/{event}/sessions', [EventController::class, 'storeSession']);
        Route::put('/events/{event}/sessions/{session}', [EventController::class, 'updateSession']);
        Route::delete('/events/{event}/sessions/{session}', [EventController::class, 'destroySession']);
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/vouchers', [VoucherController::class, 'store']);
        Route::post('/vouchers/redeem', [VoucherController::class, 'redeem']);
        Route::get('/attendance', [AttendanceController::class, 'index']);
        Route::post('/attendance', [AttendanceController::class, 'store']);
        Route::post('/certificates', [CertificateController::class, 'store']);
        Route::put('/certificates/{certificate}', [CertificateController::class, 'update']);
        Route::get('/reports', ReportController::class);
    });

    Route::middleware('role:admin')->put('/users/{user}/role', [UserController::class, 'updateRole']);
});
