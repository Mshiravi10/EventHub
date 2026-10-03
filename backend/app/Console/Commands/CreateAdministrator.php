<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

#[Signature('eventhub:make-admin {name : نام مدیر} {email : ایمیل مدیر} {password : گذرواژه مدیر} {--role=admin : نقش admin یا organizer}')]
#[Description('ایجاد یا ارتقای کاربر مدیر سامانه')]
class CreateAdministrator extends Command
{
    public function handle(): int
    {
        $role = $this->option('role');

        if (! in_array($role, ['admin', 'organizer'], true)) {
            $this->error('نقش باید admin یا organizer باشد.');

            return self::FAILURE;
        }

        User::query()->updateOrCreate(
            ['email' => $this->argument('email')],
            [
                'name' => $this->argument('name'),
                'role' => $role,
                'password' => Hash::make($this->argument('password')),
                'is_active' => true,
            ],
        );

        $this->info('حساب مدیر با موفقیت آماده شد.');

        return self::SUCCESS;
    }
}
