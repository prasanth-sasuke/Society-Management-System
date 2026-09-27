# Production review (Phase 14)

Scope: Web (React → Node.js → PostgreSQL) and Mobile (React Native → Node.js → PostgreSQL),
reviewed for architecture, security, performance, database, API design, environment variables,
deployment, error handling, logging, backups and documentation.

## Architecture

- One Express API (`server/`) is the only component that talks to PostgreSQL. Both the web app and the
  mobile app are clients of the same `/api` routes, the same logins and the same permission matrix.
- Business rules live in `server/src/services/*`; routes only validate input (Zod), check permissions and call a service.
- In production one Render service serves the API and the built web app from the same origin (no CORS, one deploy).
- Prisma migrations are the single source of truth for the schema; they are applied automatically on every deploy.

## Changes made during the review

| Area | Change |
|---|---|
| Security | Login rate limit: 8 failed attempts per email + IP, 40 per IP, per 15 minutes (HTTP 429) |
| Security | Login timing: a dummy bcrypt comparison runs for unknown emails, so response time does not reveal which emails exist |
| Security | JWT pinned to HS256 on sign and verify |
| Security | Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS in production |
| Safety | `prisma:seed` / `prisma:seed:cloud` refuse to wipe a database that already has data unless `SEED_RESET=yes` |
| Performance | Hashed web assets (`/assets/*`) cached for one year (`immutable`); `index.html` revalidated |
| Logging | One line per API request in production (`GET /api/bills 200 12ms`), no bodies or tokens logged; health checks skipped |
| Error handling | Web: error boundary shows "Something went wrong" + Reload instead of a blank page. Mobile: expo-router error boundary |
| Backups | `npm run backup:cloud` — verified dump of Neon, automatic PostgreSQL-version matching via Docker, keeps the newest 14 |
| Verification | `verify:api` and `verify:cloud` rewritten for an empty (no demo data) database |
| Config | Removed an unused demo password from `web/.env.development` and `web/.env.example` |
| Mobile | Android APK limited to ARM processors + R8 shrinking: 95 MB → 44.7 MB (measured on the EAS preview build); iOS configuration added; iOS time picker fixed |
| Docs | README and `docs/` (local setup, deployment, environment, troubleshooting, this review) |

## Verified

- No secrets in the Git history; `.env`, `.env.cloud`, `dumps/` are gitignored.
- Every API route has an authentication + permission check; resident / vendor logins are limited to their own flat / vendor.
- Input is validated with Zod; request bodies are limited to 100 KB; errors return `{ error, details? }` without stack traces.
- Passwords are stored with bcrypt (cost 12); deactivated users are rejected on every request, not only at sign-in.
- Database: 33 tables, 50 secondary indexes and 4 composite unique constraints on the columns used for lookups and filters.
  The app uses Neon's pooled connection; migrations use the direct connection.
- Security test (8/8), `verify:api`, `verify:cloud` (migrations 7/7), cloud backup + restore into a throwaway PostgreSQL 18,
  web production build, mobile lint and Android/iOS bundles, and production-mode static serving were all run successfully.

## Known limitations and recommendations

| Topic | Status | Recommendation |
|---|---|---|
| Content-Security-Policy | Not set (the UI uses many inline styles) | Add a CSP once styles move to CSS files |
| Token revocation | Stateless JWT: sign-out and password change do not invalidate an already issued token (12 h max). Deactivating a user does take effect immediately | Shorter expiry or a token version column if needed |
| Login rate limit | Kept in memory; resets when the server restarts and is per instance | Move to the database/Redis if the API ever runs on several instances |
| Render free plan | Sleeps after ~15 min idle; first request can take up to a minute | Paid instance or an uptime ping |
| Neon free plan | Short point-in-time restore window | Run `npm run backup:cloud` weekly (cron example in DEPLOYMENT.md) and keep copies off the laptop |
| Health check | `/api/health` returns HTTP 200 with `"db":"down"` when the database is unreachable | Fine for Render's liveness check; external monitors should read the `db` field |
| npm audit (server) | 4 high findings in the Prisma **CLI's** config loader (`deepmerge-ts`, `effect`), used only at build/migrate time, not at runtime. The suggested "fix" downgrades Prisma | Update Prisma when a patched release is available |
| npm audit (mobile) | 15 moderate findings in Expo build tooling, not shipped in the app | Update with the next Expo SDK |
| npm audit (web) | 0 | — |
| Web bundle | Single 616 KB JS file (146 KB gzipped) | Code-split per screen if it grows |
| Facility bookings | Overlap check covers same facility, date and time range; overnight slots are checked only against their start date; free-text slots only clash on identical text | Use the time-range format ("6–10 pm") for slots |
| Permissions | Accountant cannot pay vendor invoices (needs vendors-write + finance-write); residents can see Reports (by decision) | Adjust `server/src/auth/permissions.js` if the society wants otherwise |
| iOS | Configured but not built — needs an Apple Developer Program membership | See DEPLOYMENT.md section 4 |
| Root tooling | Root `package.json` and `neon.ts` contain Neon tooling that the app does not use | Harmless; remove if not needed |
| Mobile updates | App changes (including the error boundary and size settings) reach phones only after a new EAS build | Rebuild after mobile changes |
