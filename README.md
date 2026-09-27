# Society Operations Suite

Operations software for a residential society: flats and residents, maintenance
billing and payments, helpdesk tickets, facility bookings, vendors / AMC /
invoices, security and staff, accounts (vouchers, banks, budget) and reports.

There is **one system** with two front ends that share the same API and database:

```
Web (React + Vite)  ─┐
                     ├──►  Node.js + Express API (server/)  ──►  PostgreSQL
Android (Expo / RN) ─┘       JWT auth · role permissions         (Prisma ORM)
```

| Environment | Web + API | Database |
|---|---|---|
| Local development | `http://localhost:5173` (Vite) → API on `http://127.0.0.1:3001` | Local PostgreSQL 16 |
| Production | https://society-operations-suite.onrender.com (Render, one service serves the API and the built web app) | Neon PostgreSQL (cloud) |

The mobile app (Expo React Native) is released for Android as an APK; iOS is configured
and needs an Apple Developer account to build (see `docs/DEPLOYMENT.md`). It talks to the
production API by default and can be pointed at a laptop for development (see `docs/LOCAL-SETUP.md`).

## Repository layout

```
server/        Node.js + Express 5 API, Prisma schema/migrations, maintenance scripts
  src/         app.js (middleware), routes.js (all /api routes), services/ (business logic),
               auth/ (JWT, permission matrix, login rate limit), schemas.js (Zod validation)
  prisma/      schema.prisma, migrations/, seed.js (creates the society + superadmin)
  scripts/     verify-*, backup-cloud, migrate-to-cloud, seed-cloud
web/           React 18 + Vite single-page app
mobile/        Expo (React Native) app for Android and iOS, expo-router screens in src/app/
scripts/       production-build.sh / production-start.sh (used by Render)
render.yaml    Render blueprint for the production web service
prototype/     The original HTML prototype (reference only)
dumps/         Local database backups (gitignored)
```

## Roles

`SUPERADMIN`, `ADMIN`, `EC` (executive committee), `MANAGER`, `ACCOUNTANT`,
`SECURITY`, `RESIDENT` (linked to a flat), `VENDOR` (linked to a vendor). The
permission matrix lives in `server/src/auth/permissions.js`; every API route
checks it, and residents / vendors only see their own flat / vendor records.
The first login is the superadmin created by the seed; every other login is
created from **Users** inside the app.

## Documentation

| Document | What it covers |
|---|---|
| [docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md) | Run PostgreSQL, the backend, the web app and the Android app on Ubuntu |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Neon + Render deployment, database migrations, Android APK/AAB and iOS builds, backups and restore |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Every environment variable, which file it lives in, and what must never be committed |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common problems and their fixes |
| [docs/PRODUCTION-REVIEW.md](docs/PRODUCTION-REVIEW.md) | Final architecture / security / performance review and known limitations |

## Quick start (local, Ubuntu)

Prerequisites: Node.js 22 (`nvm use` reads `.nvmrc`), PostgreSQL 16, Git.

```bash
cp .env.example .env              # then edit the CHANGE_ME values
cd server && npm ci
npx prisma migrate deploy         # create tables
npm run prisma:seed               # society + superadmin (empty database only)
npm run dev                       # API on http://127.0.0.1:3001

# second terminal
cd web && npm ci && npm run dev   # open http://localhost:5173
```

Full step-by-step instructions, including creating the database user, are in
[docs/LOCAL-SETUP.md](docs/LOCAL-SETUP.md).

## Security rules for this repository

- Never commit `.env`, `.env.cloud`, database URLs, `JWT_SECRET` or real passwords.
  They are gitignored; only the `*.example` files are tracked.
- `EXPO_PUBLIC_*` and `VITE_*` values are bundled into the apps and are public. Never put secrets in them.
- `npm run prisma:seed` erases all data; it refuses to run on a database that is already in use
  unless you set `SEED_RESET=yes` (take a backup first).
