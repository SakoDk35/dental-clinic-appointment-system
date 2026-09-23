# Dental Clinic Appointment Booking System

A full-stack dental clinic application for patient booking and day-to-day clinic
workflows. Patients manage appointments, while staff coordinate schedules,
treatment records, and billing through role-based interfaces.

## Live Demo

- **Frontend:** [https://dental-clinic-frontend-2hwo.onrender.com](https://dental-clinic-frontend-2hwo.onrender.com)
- **Backend health:** [https://dental-clinic-api-x1b2.onrender.com/health](https://dental-clinic-api-x1b2.onrender.com/health)

The frontend runs on a Render Static Site, the backend on a Render Web Service,
and PostgreSQL is hosted on Neon. The Render free backend may take approximately
50 seconds to wake after inactivity.

## Features

- Role-based dashboards for Admin, Receptionist, Dentist, and Patient
- Patient registration with validated phone numbers
- Appointment booking, cancellation, and patient self-rescheduling
- Dentist weekly availability and time-off exceptions
- Double-booking protection, including overlapping 30/60-minute appointments
- Appointment lifecycle from booking through confirmation and completion
- Dentist treatment notes visible to the author and Admin
- Billing with `UNPAID`, `PAID`, and `VOID` statuses
- In-app notifications
- Patient search and appointment search/filtering
- Responsive UI across desktop, tablet, and mobile
- Terms of Service, Privacy Policy, and Contact pages

## Demo Accounts

| Role | Email |
|---|---|
| Admin | admin@clinic.com |
| Receptionist | reception@clinic.com |
| Dentist | dentist@clinic.com |
| Dentist 2 | dentist2@clinic.com |
| Patient | patient@clinic.com |

**Password for all accounts:** `Password123`

These are public demo accounts intended only for evaluating the application.
Do not enter real personal, medical, or payment information.

## Stack

- **Frontend:** React + TypeScript + Vite + Bootstrap
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT + bcrypt password hashing

## Project Structure

```
dental-clinic-project/
├── frontend/   # React app
└── server/     # Express API + Prisma schema
```

## Running It Locally

### 1. Database + Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env: set DATABASE_URL and DIRECT_URL (both may use the same local database),
# a JWT_SECRET of at least 32 characters, and FRONTEND_URL=http://localhost:5173

npx prisma migrate dev
npm run prisma:seed
npm run dev
```

The server runs on `http://localhost:4000`. Confirm it's healthy:

```bash
curl http://localhost:4000/health
# { "status": "ok", "database": "connected" }
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000/api/v1
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

New patients can also self-register from the Login page. The seed creates the
demo accounts, dentist profiles, weekly working hours, and services; it does
not create sample appointments or payments.

## Roles & Permissions

- **Admin** — full access: dentists, services, staff accounts, billing/revenue, all patients and appointments.
- **Receptionist** — manages patients and appointments, marks payments as paid; no revenue figures, no treatment notes.
- **Dentist** — sees only their own schedule, marks appointments completed, writes optional treatment notes (visible only to that dentist and Admin).
- **Patient** — books, cancels, and reschedules their own appointments; views their own profile and appointment history.

## Core Business Rules Enforced by the Backend

- A dentist can never have two overlapping appointments. This is owned by
  `assertSlotIsFree()` in `appointments.service.ts`, which checks real interval
  overlap and ignores cancelled appointments. PostgreSQL also enforces the rule
  under concurrent requests with a GiST exclusion constraint over dentist,
  appointment date, and the half-open `[start, end)` time range. A plain unique
  start-time constraint would not catch 30/60-minute overlaps and would wrongly
  block re-booking cancelled slots.
- Appointments cannot be booked or rescheduled into the past.
- Appointment times must fall within the dentist's weekly working hours.
- Dentist time-off blocks affected booking and rescheduling slots.
- Future appointments cannot be marked completed.
- Treatment notes are visible only to the writing dentist and Admin — never Receptionist or Patient.
- Treatment notes can only be written or edited after the appointment is completed.
- Cancelling an unpaid appointment voids its payment. Only completed appointments
  can be marked paid; void payments never contribute to revenue or unpaid debt.
- Passwords are always hashed; `passwordHash` is never returned by any API response.
- Every route enforces its own role check server-side — the frontend's route guards are a UX convenience only.

## Environment Variables

Backend (`server/.env`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/dental_clinic?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@localhost:5432/dental_clinic?schema=public"
PORT=4000
JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
FRONTEND_URL="http://localhost:5173"
```

Prisma uses `DATABASE_URL` at runtime and `DIRECT_URL` for migrations. In
production, these are the Neon pooled and direct connection URLs, respectively.
`FRONTEND_URL` accepts a comma-separated list when more than one browser origin
is needed. The frontend uses `VITE_API_URL`, as shown in `frontend/.env.example`.
Never commit real credentials or secrets.

## Deployment

- **Frontend:** Render Static Site, configured with the backend's public API URL.
- **Backend:** Render Web Service, configured with the frontend origin and JWT secret.
- **Database:** Neon PostgreSQL; the API uses the pooled connection and Prisma migrations use the direct connection.
- **Backend build:** `npm ci --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build`.
- **Migrations:** Prisma migrations run automatically during the Render backend build; no separate Pre-Deploy Command is used.
- **Secrets:** Configure environment variables in the hosting services; keep `.env` files and credentials out of Git.

## Security Basics

- JWTs expire after eight hours. The API also checks the current database user
  on every authenticated request, so deleted or deactivated accounts are rejected
  and authorization uses the user's current role.
- The server refuses to start with a missing or short `JWT_SECRET`.
- CORS is limited to the configured frontend origin(s).
- Login is limited to 20 failed attempts per 15 minutes per client; successful
  logins do not consume that allowance. Registration is limited to 10 attempts
  per hour.
- An Admin cannot deactivate their own account or leave the system without an
  active Admin.

## API

All endpoints are under `/api/v1`. Responses follow one consistent shape:

```json
{ "success": true, "data": { } }
{ "success": false, "message": "Human readable error message" }
```

Main endpoint groups: `/auth`, `/users`, `/patients`, `/dentists`, `/services`,
`/appointments`, `/payments`, `/notifications`, `/dashboard`.

## What's Intentionally Not Included

Per the approved MVP scope: no multi-branch support, no Super Admin, no
mobile app, no insurance, no online payments, no SMS/email integrations, no
recurring or emergency appointments, no advanced medical records, no complex
reporting, no AI features, no microservices, no Docker.

## Note on Migrations

The migration history includes the PostgreSQL overlap exclusion constraint,
`VOID` payment status, and dentist time-off. The Render backend build applies
migrations automatically. For local or other environments, apply migrations
forward; do not reset an existing database:

```bash
cd server
npx prisma migrate deploy
```

## Automated API Tests

The integration suite covers authentication/RBAC, patient phone validation,
overlap and concurrent booking protection, working hours and time-off,
rescheduling, cancelled-slot rebooking, lifecycle rules, treatment-note privacy,
billing, strict payment dates, timezone behavior, and API 404 responses.

Tests deliberately require a separate PostgreSQL database whose name contains
`test`. They never fall back to the development `DATABASE_URL`:

```bash
# Create and migrate a separate database first, for example dental_clinic_test.
# Set TEST_DATABASE_URL in your shell, then:
cd server
npm test
```

The suite clears only its isolated test database before and after execution.

## Known Limitations

- Appointments use a responsive agenda/list rather than a calendar grid.
- The Admin dashboard shows real revenue, unpaid balance, and appointment
  figures from `/dashboard/admin`; it does not include a revenue chart.
