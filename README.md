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
# edit .env: set DATABASE_URL to your local PostgreSQL connection string,
# and set JWT_SECRET to any long random string

npx prisma migrate dev --name init
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

New patients can also self-register from the Login page.

## Roles & Permissions

- **Admin** — full access: dentists, services, staff accounts, billing/revenue, all patients and appointments.
- **Receptionist** — manages patients and appointments, marks payments as paid; no revenue figures, no treatment notes.
- **Dentist** — sees only their own schedule, marks appointments completed, writes optional treatment notes (visible only to that dentist and Admin).
- **Patient** — books/cancels their own appointments, views their own profile and appointment history.

## Core Business Rules Enforced by the Backend

- A dentist can never have two overlapping appointments. This is owned by
  `assertSlotIsFree()` in `appointments.service.ts`, which checks real interval
  overlap and ignores cancelled appointments. (A database unique constraint was
  deliberately removed: it could only catch identical start times, and it
  wrongly blocked re-booking a slot whose appointment had been cancelled.)
- Appointments cannot be booked or rescheduled into the past.
- Appointment times must fall within the dentist's weekly working hours.
- Treatment notes are visible only to the writing dentist and Admin — never Receptionist or Patient.
- Passwords are always hashed; `passwordHash` is never returned by any API response.
- Every route enforces its own role check server-side — the frontend's route guards are a UX convenience only.

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

## Known Limitations

- TypeScript compilation of the backend has not been run in the environment
  this was built in (no network access for `npm install`). Run `npm run build`
  (or `npx tsc --noEmit`) in `server/` after installing dependencies to catch
  anything that needs a small fix.
- `frontend/src/api/mockData.ts` and `frontend/src/pages/PlaceholderPage.tsx`
  are no longer used by any page (every screen now calls the real backend)
  but were left in place rather than deleted, in keeping with "don't remove
  working code unnecessarily." Safe to delete once you've confirmed you don't
  need them for reference.
- The Appointments screen uses a single agenda/list layout at every screen
  size (rather than a separate desktop grid + mobile list) — this was a
  deliberate simplification: it satisfies the approved "simplified list view
  on mobile" requirement, works identically well on desktop, and avoids
  building and maintaining two different calendar implementations.
- The Admin dashboard's original "weekly revenue chart" mockup used
  placeholder numbers with no real backing data or endpoint; it was removed
  rather than shipped with fake numbers. The real revenue/unpaid/appointment
  stat cards are backed by a real `/dashboard/admin` endpoint.
