# Troubleshooting

Diagnose from the actual error first: API terminal output, Render **Logs**, the browser
DevTools **Network** tab, or the Metro terminal for the mobile app.

## Backend / database

**`Error: listen EADDRINUSE: address already in use 127.0.0.1:3001`**
Another API instance is running.
```bash
ss -ltnp | grep 3001          # shows the PID
kill <PID>
```

**`JWT_SECRET is missing. Set a long random value in .env` / server exits immediately**
`.env` is missing or `server/.env` symlink is broken. Check `ls -la server/.env`
(should point to `../.env`) and that `JWT_SECRET` has a value.

**`P1000: Authentication failed` or `password authentication failed for user "society_app"`**
The password in `DATABASE_URL` does not match the database role. Special characters in the
password must be URL-encoded in the URL (`@` → `%40`, `#` → `%23`). Reset the role password with
`sudo -u postgres psql -c "ALTER ROLE society_app PASSWORD 'new-password';"` and update `.env`.

**`P1001: Can't reach database server at localhost:5432`**
PostgreSQL is not running: `sudo systemctl start postgresql`, then `systemctl status postgresql --no-pager`.

**`The table public.xxx does not exist`**
Migrations were not applied: `cd server && npx prisma migrate deploy`.

**`P3014` / shadow database error during `prisma migrate dev`**
The role cannot create databases: `sudo -u postgres psql -c "ALTER ROLE society_app CREATEDB;"`.

**Seed says "This database already has a society. Seeding would ERASE ALL DATA"**
This is a safety stop. The seed is only for an empty database. If you really want to wipe it:
back up, then `SEED_RESET=yes npm run prisma:seed`.

**`/api/health` returns `"db":"down"`** (the HTTP status is still 200)
The API is up but cannot reach PostgreSQL. Locally: check PostgreSQL is running. In production:
check the Neon project is not suspended and that `DATABASE_URL` in Render is the current pooled URL.

## Sign-in

**"Invalid email or password."**
Emails are case-insensitive; passwords are not. Only the superadmin exists after seeding;
create other logins from **Users**. A deactivated user cannot sign in.

**"Too many failed sign-in attempts. Try again in N minutes." (HTTP 429)**
Brute-force protection: 8 failed attempts for the same email from the same network, or 40 from
one IP address, within 15 minutes. Wait for the time shown; a successful sign-in resets the count.
Restarting the server also clears it.

**Suddenly signed out / "Your session has expired. Please sign in again."**
Tokens last 12 hours (`JWT_EXPIRES_IN`). Changing `JWT_SECRET` or deactivating the user also ends sessions.

**403 "You do not have access to this module."**
The role does not have that permission. See the matrix in `server/src/auth/permissions.js` (also
visible on the website under **Users & role permissions → Permission matrix**).

## Web app

**Blank page or "Something went wrong" with a Reload button**
A screen crashed. Open DevTools → Console for the error, then reload. Report the error text.

**API calls fail with 404/502 in development**
The API is not running on port 3001, or `VITE_API_URL` was set. Keep `VITE_API_URL` empty and start the server.

**Old version after a deploy**
Hard reload (Ctrl+Shift+R). `index.html` is revalidated on every load, so a normal reload usually picks up the new build.

## Production (Render / Neon)

**First request takes 30–60 seconds**
The free Render service was asleep. It wakes up on the first request; later requests are fast.

**Deploy failed**
Open Render → service → **Events** → failed deploy → logs.
- Build step: usually a dependency or Vite error; reproduce locally with `bash scripts/production-build.sh`.
- Start step: `prisma migrate deploy` errors usually mean `DIRECT_URL` is missing/wrong or a migration failed.
  Fix the migration, then redeploy. Never edit a migration that has already been applied; add a new one.

**`verify:cloud` / `backup:cloud` connects to the wrong database**
Do not `source .env.cloud` in bash: the `&` in Neon URLs breaks shell parsing and the script may silently
fall back to the local database. The scripts read `.env.cloud` themselves via `server/scripts/cloud-env.js`.

**`getaddrinfo ENOTFOUND ep-xxxx.neon.tech` from local scripts**
Some routers' DNS cannot resolve Neon host names. `cloud-env.js` already resolves them through a public DNS
server; if it still fails, check the laptop has internet access and the host name in `.env.cloud` is correct.

**`pg_dump: error: aborting because of server version mismatch`**
Local `pg_dump` 16 cannot dump Neon (PostgreSQL 18). `npm run backup:cloud` handles this automatically with the
`postgres:18-alpine` Docker image; make sure Docker is running (`docker ps`) and your user is in the `docker` group.

## Mobile app

**Expo Go: "Could not connect to development server" / stuck loading**
- Phone and laptop must be on the same Wi-Fi (guest networks often block device-to-device traffic).
- Start with `npx expo start --lan --clear`.
- Allow Metro through the firewall: `sudo ufw allow 8081/tcp`.
- Last resort: `npx expo start --tunnel`.

**App shows "Couldn't reach the server. Check your internet connection."**
- Default API is production; the first request after a sleep can take up to a minute — try again.
- Using the laptop API: it must be started with `LISTEN_HOST=0.0.0.0`, `EXPO_PUBLIC_API_URL` must use the laptop's
  Wi-Fi IP (not `localhost`), port 3001 must be allowed (`sudo ufw allow 3001/tcp`), and Expo must be restarted with `--clear`
  after changing `mobile/.env`.

**Changes to `mobile/.env` have no effect**
`EXPO_PUBLIC_*` values are read at bundle time. Restart with `npx expo start --clear`. For installed APKs, the value comes
from `mobile/eas.json` and needs a new EAS build.

**Installed APK does not have the latest mobile changes**
The APK contains the JavaScript from the time it was built. Build again with `eas build -p android --profile preview`.
(Server changes do not need a new APK.)

**"App not installed" when installing an APK**
An APK signed with a different key (for example an Expo Go dev build) is installed with the same package name.
Uninstall the old app first.

**Metro: `Unable to resolve module ...` after pulling changes**
Dependencies changed: `cd mobile && npm ci && npx expo start --clear`.
