<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', DashboardController::class);
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event:slug}', [EventController::class, 'show']);
Route::post('/registrations', [RegistrationController::class, 'store']);
Route::get('/vouchers', [VoucherController::class, 'index']);
Route::post('/vouchers/redeem', [VoucherController::class, 'redeem']);
Route::post('/attendance', AttendanceController::class);
Route::get('/certificates', CertificateController::class);
