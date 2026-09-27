# Local setup (Ubuntu)

This runs the whole system on one laptop:

```
Browser  http://localhost:5173  (Vite dev server, web/)
            │  /api/* is proxied
            ▼
Node API  http://127.0.0.1:3001  (server/)
            ▼
PostgreSQL localhost:5432  database society_management_dev
```

Commands are for Ubuntu. Run them from the repository root unless a `cd` is shown.

## 1. Prerequisites

### Node.js 22

The repository pins Node 22 in `.nvmrc`.

```bash
# Install nvm once (skip if `nvm --version` works)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc

nvm install 22
nvm use          # inside the repo; reads .nvmrc
node -v          # v22.x
```

### PostgreSQL 16

```bash
sudo apt update
sudo apt install -y postgresql postgresql-client
sudo systemctl enable --now postgresql
systemctl status postgresql --no-pager     # should say "active (exited)"/"active (running)"
psql --version
```

## 2. Create the database and user

Pick your own password; it goes into `.env` only.

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE society_app LOGIN PASSWORD 'choose-a-strong-password' CREATEDB;
CREATE DATABASE society_management_dev OWNER society_app;
SQL
```

`CREATEDB` lets `prisma migrate dev` create its temporary "shadow" database when
you write new migrations.

Check that the login works (it asks for the password):

```bash
psql -h localhost -U society_app -d society_management_dev -c "select current_user, version();"
```

## 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

- Replace every `CHANGE_ME` in `PGPASSWORD`, `DATABASE_URL` and `DIRECT_URL` with the password from step 2.
  If the password contains `@`, `#`, `/` or `:`, URL-encode it inside the URLs (`@` → `%40`).
- Set `JWT_SECRET` to a long random value:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
  ```
- Set `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` (the first login).

`server/.env` is a symlink to the root `.env`, so there is only one file to edit.
If the symlink is missing (for example after a fresh clone on Windows), recreate it:

```bash
ln -s ../.env server/.env
```

See [ENVIRONMENT.md](ENVIRONMENT.md) for every variable.

## 4. Run the backend (Node.js API)

```bash
cd server
npm ci                      # install exact versions from package-lock.json
npx prisma migrate deploy   # create / update tables
npm run prisma:seed         # creates "My Society" + the superadmin (empty database only)
npm run dev                 # starts the API with auto-restart on file changes
```

Expected output: `API listening on http://127.0.0.1:3001`.

Check it from another terminal:

```bash
curl http://127.0.0.1:3001/api/health
# {"ok":true,"service":"society-management-api","db":"up"}
```

Useful backend commands (run inside `server/`):

| Command | Purpose |
|---|---|
| `npm run dev` | API with auto-restart (development) |
| `npm start` | API without auto-restart |
| `npx prisma migrate dev --name <change>` | After editing `prisma/schema.prisma`: creates and applies a new migration |
| `npx prisma studio` | Browse the local database in the browser |
| `npm run verify:api` | Smoke test against the running API (health, login, permissions); cleans up after itself |
| `npm run prisma:verify` | Create/read/update/delete test against the database |

`npm run prisma:seed` wipes every table before creating the superadmin, so it
refuses to run when a society already exists. To really start over:
`SEED_RESET=yes npm run prisma:seed`.

## 5. Run the web application (React)

```bash
cd web
npm ci
npm run dev
```

Open http://localhost:5173 and sign in with the superadmin email and password from `.env`.

Vite proxies every `/api` request to `http://127.0.0.1:3001` (see `web/vite.config.js`),
so the web app needs no API URL in development. Keep `VITE_API_URL` empty.

To test the production build locally:

```bash
cd web && npm run build          # creates web/dist
cd ../server && NODE_ENV=production node --env-file=.env src/index.js
# open http://127.0.0.1:3001  (the API also serves web/dist)
```

## 6. Run the React Native (Android) application

The mobile app is in `mobile/` and uses Expo.

```bash
cd mobile
npm ci
npx expo start --lan
```

A QR code is printed.

1. Install **Expo Go** from the Play Store on your Android phone.
2. Connect the phone to the **same Wi-Fi** as the laptop.
3. Open Expo Go → *Scan QR code* and scan the code from the terminal.

By default the app uses the **live production API**
(`https://society-operations-suite.onrender.com`), so it shows production data.

### Pointing the app at your laptop's API

1. Find the laptop's Wi-Fi address: `hostname -I | awk '{print $1}'` (for example `192.168.31.33`).
2. Start the API so it listens on the network, not only on localhost:
   ```bash
   cd server && LISTEN_HOST=0.0.0.0 npm run dev
   ```
3. Create `mobile/.env`:
   ```bash
   cp mobile/.env.example mobile/.env
   # set: EXPO_PUBLIC_API_URL=http://192.168.31.33:3001
   ```
4. Restart Expo with a clean cache: `npx expo start --lan --clear`.
5. If the phone cannot connect, allow the ports through the firewall:
   `sudo ufw allow 3001/tcp && sudo ufw allow 8081/tcp`.

Other mobile commands:

| Command | Purpose |
|---|---|
| `npx expo start --lan --clear` | Start Metro and clear the bundler cache |
| `npx expo start --tunnel` | Use when the phone and laptop cannot be on the same network (slower) |
| `npm run lint` | ESLint (Expo config) |
| `npx expo export --platform android` | Check that the Android JavaScript bundle builds |

On an iPhone, install **Expo Go** from the App Store and scan the QR code with the Camera app; everything else is the same.

Building an installable APK or an iOS build is covered in [DEPLOYMENT.md](DEPLOYMENT.md#3-android-app-builds-eas).
