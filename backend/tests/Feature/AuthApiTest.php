<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_registers_a_participant_and_returns_an_access_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'کاربر واقعی',
            'email' => 'person@example.test',
            'password' => 'SecurePass8',
            'password_confirmation' => 'SecurePass8',
            'phone' => '09120000000',
            'national_code' => '0012345678',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user.email', 'person@example.test')
            ->assertJsonPath('user.role', 'participant')
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', [
            'email' => 'person@example.test',
            'national_code' => '0012345678',
            'role' => 'participant',
        ]);
    }

    public function test_rejects_invalid_login_credentials_with_422(): void
    {
        User::factory()->create([
            'email' => 'member@example.test',
            'password' => Hash::make('SecurePass8'),
        ]);

        $this->postJson('/api/auth/login', [
            'email' => 'member@example.test',
            'password' => 'incorrect-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_registration_ignores_a_submitted_privileged_role(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'کاربر عادی',
            'email' => 'normal@example.test',
            'password' => 'SecurePass8',
            'password_confirmation' => 'SecurePass8',
            'national_code' => '0012345679',
            'role' => 'admin',
        ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'participant');
    }

    public function test_rejects_an_invalid_national_code_during_registration_with_422(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'کاربر عادی',
            'email' => 'invalid-national-code@example.test',
            'password' => 'SecurePass8',
            'password_confirmation' => 'SecurePass8',
            'national_code' => '1234',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['national_code']);
    }
}
