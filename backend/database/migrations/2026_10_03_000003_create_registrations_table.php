<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_session_id')->nullable()->constrained()->nullOnDelete();
            $table->string('registration_code')->unique();
            $table->string('status')->default('confirmed')->index();
            $table->string('attendance_status')->default('absent')->index();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'event_id', 'event_session_id'], 'unique_session_registration');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
