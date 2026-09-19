# Dental Clinic Backend — Step 1: Project Scaffolding

This is the `server/` folder inside `dental-clinic-project/`. The frontend
lives alongside it at `dental-clinic-project/frontend/` — they are separate
folders/apps that together make up the one full-stack project.

## What exists right now

- Express server with one route: `GET /health` (confirms server + DB connection are working)
- Prisma connected to PostgreSQL
- One database table: `User`
- A seed script that creates one Admin account

Nothing else. No login endpoint, no other tables — those come in later steps.

## Setup

From the `dental-clinic-project/server/` folder:

```bash
npm install
```

An `.env` file already exists in this folder (copied from `.env.example`).
Open it and set `DATABASE_URL` to your real local PostgreSQL connection
string (a free local Postgres install, or a free Render/Railway Postgres
instance both work fine for this MVP).

## Run the migration (creates the `User` table)

```bash
npx prisma migrate dev --name init
```

This is the actual database change for this step — run it before starting
the server.

## Seed the Admin account

```bash
npm run prisma:seed
```

Creates: `admin@clinic.com` / `Password123`

## Start the server

```bash
npm run dev
```

## Verify it worked

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{ "status": "ok", "database": "connected" }
```

If you get `"database": "unreachable"`, double-check `DATABASE_URL` in `.env`.

## Sandbox note

This was written in an environment without network/database access, so the
migration and server could not actually be run and verified here. Please run
the commands above locally and let me know if anything errors — that's our
"testing performed" for this step in practice.

## Running the whole project

**Backend** (this folder, `dental-clinic-project/server/`):
```bash
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

**Frontend** (`dental-clinic-project/frontend/`, in a separate terminal):
```bash
npm install
npm run dev
```

The frontend currently uses mock data and does not call this backend yet —
that connection happens progressively as each feature (Auth, Patients,
Dentists, Appointments...) is built in later steps.

