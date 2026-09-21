# Dental Clinic Appointment Booking System

A small, full-stack MVP for a single dental clinic: patients book appointments
online, staff manage the schedule and billing, dentists record simple
treatment notes. Built deliberately simple — no microservices, no message
queues, no over-engineering — so the whole thing stays easy to read and
explain.

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
# edit .env: set DATABASE_URL, a JWT_SECRET of at least 32 characters,
# and FRONTEND_URL=http://localhost:5173

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

## Demo Accounts

All demo accounts created by `npm run prisma:seed` share the password
`Password123`:

| Role | Email |
|---|---|
| Admin | admin@clinic.com |
| Receptionist | reception@clinic.com |
| Dentist | dentist@clinic.com |
| Dentist (2nd) | dentist2@clinic.com |
| Patient | patient@clinic.com |

New patients can also self-register from the Login page. The seed creates the
accounts, dentist profiles, weekly working hours, and services listed above; it
does not create sample appointments or payments.

## Roles & Permissions

- **Admin** — full access: dentists, services, staff accounts, billing/revenue, all patients and appointments.
- **Receptionist** — manages patients and appointments, marks payments as paid; no revenue figures, no treatment notes.
- **Dentist** — sees only their own schedule, marks appointments completed, writes optional treatment notes (visible only to that dentist and Admin).
- **Patient** — books/cancels their own appointments, views their own profile and appointment history.

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
PORT=4000
JWT_SECRET="replace-with-a-random-secret-of-at-least-32-characters"
FRONTEND_URL="http://localhost:5173"
```

`FRONTEND_URL` accepts a comma-separated list when more than one browser origin
is needed. The frontend uses `VITE_API_URL`, as shown in `frontend/.env.example`.
Never commit real credentials or secrets.

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

If you already ran an earlier migration that included the
`@@unique([dentistId, appointmentDate, startTime])` constraint on
`Appointment`, run `npx prisma migrate dev` again after pulling this version —
that constraint has been replaced with a plain index (see "Core Business Rules"
above for why).

The later migrations add the PostgreSQL exclusion constraint and the `VOID`
payment status. Run migrations forward; do not reset an existing database:

```bash
cd server
npx prisma migrate deploy
```

## Automated API Tests

The focused integration suite covers authentication/RBAC, overlap and concurrent
booking protection, working hours, cancelled-slot rebooking, lifecycle rules,
treatment-note privacy, billing, strict payment dates, timezone behavior, and API
404 responses.

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

- The Appointments screen uses a single agenda/list layout at every screen
  size (rather than a separate desktop grid + mobile list) — this was a
  deliberate simplification: it satisfies the approved "simplified list view
  on mobile" requirement, works identically well on desktop, and avoids
  building and maintaining two different calendar implementations.
- The Admin dashboard's original "weekly revenue chart" mockup used
  placeholder numbers with no real backing data or endpoint; it was removed
  rather than shipped with fake numbers. The real revenue/unpaid/appointment
  stat cards are backed by a real `/dashboard/admin` endpoint.
