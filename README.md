# EventHub

EventHub is a bilingual event operations platform built for organizers who need one place to publish events manage registrations track attendance issue certificates and understand participation

The application combines a role aware Laravel API with a responsive React dashboard and provides dedicated workflows for attendees organizers and administrators

![EventHub dashboard](frontend/src/assets/hero.png)

## What it includes

- Secure registration login and token based sessions with Laravel Sanctum
- Role based access for attendees organizers and administrators
- Event and session management with capacity and attendance settings
- Registration cancellation and unique registration codes
- Voucher creation redemption and usage tracking
- Attendance check in for event staff
- Certificate creation and participant access
- Operational dashboard and participation reports
- Persian first interface with full RTL layout

## Technology

| Layer | Stack |
| --- | --- |
| API | PHP 8.3 · Laravel 13 · Sanctum |
| Web app | React 19 · TypeScript · Vite 8 · Tailwind CSS 4 |
| Data | SQLite by default with Laravel database portability |
| Quality | PHPUnit feature tests · TypeScript build checks · GitHub Actions |

## Local setup

### 1. Start the API

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

The API and Laravel welcome page are available at `http://127.0.0.1:8000`

### 2. Start the web app

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` in your browser. Vite proxies `/api` requests to the Laravel development server

## Verification

```bash
cd backend
php artisan test

cd ../frontend
npm run build
```

The backend test suite uses an in memory SQLite database so it does not alter local development data

## API overview

Public authentication endpoints are rate limited. All other endpoints require a Sanctum token

- `/api/auth` registration login and logout
- `/api/profile` profile management
- `/api/events` event and session management
- `/api/registrations` attendee registrations
- `/api/vouchers` voucher management and redemption
- `/api/attendance` attendee check in
- `/api/certificates` certificate management
- `/api/dashboard` role aware dashboard data
- `/api/reports` organizer and administrator reports
- `/api/users` user and role administration

## Repository layout

```text
EventHub/
├── backend/    Laravel API migrations factories and tests
├── frontend/   React TypeScript application and visual assets
└── LICENSE     MIT license
```

## License

EventHub is available under the [MIT License](LICENSE)
