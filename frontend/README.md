# Dental Clinic Frontend (MVP)

React + TypeScript + Bootstrap, per the approved architecture. Uses mock data — no backend connection yet.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL. Use any of these mock accounts to log in:

| Role         | Email               | Password     |
|--------------|----------------------|--------------|
| Admin        | admin@clinic.com     | Password123  |
| Receptionist | reception@clinic.com | Password123  |
| Dentist      | dentist@clinic.com   | Password123  |
| Patient      | patient@clinic.com   | Password123  |

## Structure

```
src/
├── api/          # mock data + mock "API" functions (swap for real fetch calls later)
├── components/   # reusable UI pieces, grouped by domain
├── context/      # AuthContext (logged-in user + token)
├── hooks/        # useAuth, etc.
├── pages/        # one file per screen, grouped by role
├── routes/       # route definitions + role-based route guards
├── styles/       # theme.css — design tokens (colors, type) from the approved UI spec
└── types/        # shared TypeScript types
```

## Build status note

This project was scaffolded and written in a sandboxed environment without
network access, so `npm install` / `npm run build` could not be executed
here to verify compilation end-to-end. The code follows standard,
well-tested React + TypeScript + Vite patterns — please run
`npm install && npm run build` locally as a first check, and flag anything
that surfaces.
