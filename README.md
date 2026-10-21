# Doctor Appointment Booking System

A full-stack college mini-project (SEMP): patients book appointments with doctors,
doctors manage their schedule and appointment requests, and administrators run the clinic.

> **Fictional data only.** Every doctor, patient, email and appointment in this project is
> generated demo data. No real medical information exists in it.

---

## Demo credentials

| Role | Email | Password | Lands on |
|---|---|---|---|
| Patient | `patient01@example.test` | `Patient@123` | `/patient/dashboard` |
| Doctor | `asha.rao@clinic.test` | `Doctor@123` | `/doctor/dashboard` |
| Admin | `admin@clinic.test` | `Admin@123` | `/admin/dashboard` |

Seeded content: 7 specializations · 5 doctors · 10 patients · 1 admin · 330 time slots · 10 appointments
(mixed PENDING / CONFIRMED / COMPLETED / CANCELLED / REJECTED).

## Three login links, one project

| Portal | URL |
|---|---|
| Patient | `/login/patient` |
| Doctor | `/login/doctor` |
| Administrator | `/login/admin` |

Reachable from the navbar **`Log in ▾`** dropdown and the footer **Portals** links.
`/login` redirects to `/login/patient`.

Each portal is visually isolated to its own role, but the role is **never** chosen client-side:
`POST /auth/login` returns the role stored on the account, and the route guards re-check it.

- **Patients** self-register at `/register` (public registration always creates a `PATIENT`).
- **Doctors** and **admins** cannot self-register — the admin creates doctor accounts at
  `/admin/doctors`, which is the only way a doctor account comes into existence.

---

## Run it locally — no server, no account, no deployment

This project runs entirely on your own laptop. There is nothing to host and no internet
connection is required for the demo.

| What you want | Do this |
|---|---|
| **Just demo the project** | Double-click **`start.bat`** |
| **Develop / change code** | Double-click **`start-dev.bat`** |

`start.bat` checks dependencies, builds the frontend if it is missing, starts everything and
opens your browser. It produces a **single process** — the Node server hosts both the REST API
and the built React app, so the entire system lives at **http://localhost:5000**. Closing that
window stops it.

Manual equivalent, if you prefer a terminal:

```bash
cd backend  && npm install && npm start     # API + UI together on :5000
cd frontend && npm install && npm run dev   # optional: UI on :5173 with hot reload
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3.4, React Router 6 |
| Backend | Node 22 (ESM), Express 4, `bcryptjs`, `jsonwebtoken` |
| Database | **SQLite** via Node's built-in `node:sqlite` — no server to install |
| Security | httpOnly `SameSite=Lax` JWT cookie, helmet, CORS, rate limiting, input validation |

### Why SQLite instead of MySQL

The reference architecture specifies MySQL 8, but this machine has no admin rights, no
Docker, and installing MySQL was not permitted. The schema is written once and shipped in
two dialects so the project stays portable:

- `database/schema.sqlite.sql` — executed at startup (this is what actually runs)
- `database/schema.mysql.sql` — MySQL 8 reference DDL for a server deployment

Everything above the SQL layer (repositories, services, controllers) is identical for both.
See `database/README.md` for details.

---

## Project structure

```
doctor-appointment-booking-system/
├── backend/
│   ├── data/                  SQLite file (generated, git-ignored)
│   ├── src/
│   │   ├── config/            env, database, seed
│   │   ├── middleware/        authenticate, authorizeRole, validation, errors
│   │   ├── repositories/      all SQL lives here
│   │   ├── services/          business rules + transactions
│   │   ├── controllers/       request/response shaping
│   │   ├── routes/            URL wiring + validation hooks
│   │   ├── validators/        per-payload validation
│   │   └── utils/             errors, jwt, password, datetime, http
│   └── tests/api.test.js      16 integration tests (node:test)
├── frontend/
│   └── src/
│       ├── app/               routes + guards
│       ├── layouts/           public / patient / doctor / admin shells
│       ├── pages/             public, auth, patient, doctor, admin
│       ├── components/        common, doctors, appointments
│       ├── services/          fetch-based API client
│       └── context/           AuthContext
├── database/                  schema (both dialects) + database notes
├── docs/api.md                REST API reference
└── deploy/nginx.conf.example  optional reverse-proxy config
```

---

## Quick start (development)

Requires **Node ≥ 22.5** (the code uses the built-in `node:sqlite`).

```bash
# 1. API — creates the schema, seeds demo data, listens on :5000
cd backend
npm install
npm run seed        # optional; the server also seeds an empty DB on first run
npm run dev

# 2. UI — Vite on :5173, proxying /api to :5000
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173

### Tests

```bash
cd backend
npm test            # 16 integration tests against a throwaway database
```

Covers: role-safe registration, generic login failures, public doctor directory, protected
routes, booking, **double-booking rejection (409)**, **concurrent booking → exactly one
success**, cross-patient isolation, doctor accept/reject scope, validation errors, admin
dashboard counts, and role guards.

---

## Deployment

### One-click on Render (recommended)

[![Deploy to Render](https://render.com/deploy)](https://render.com/deploy?repo=https://github.com/Nanda-vrdhn/doctor-appointment-booking-system)

The repository ships a **`render.yaml`** blueprint, so Render configures everything itself:
Node 22, the frontend build, the API start command and a generated `JWT_SECRET`. Click the
button, authorize GitHub, confirm the service name and deploy.

| Setting | Value |
|---|---|
| Build command | `cd frontend && npm install && npm run build && cd ../backend && npm install` |
| Start command | `cd backend && npm start` |
| Health check | `/api/v1/health` |
| Node | 22.20.0 — required for the built-in `node:sqlite` |

**About the database on the free plan.** Render's free instances have no persistent disk, so
the SQLite file is recreated on every deploy or restart. The server **auto-seeds** whenever
the database is empty, so the app always comes up fully populated — bookings made during a
demo are simply reset on the next deploy. Attach a disk on a paid plan to keep them.

The first request after the free instance has been idle takes ~50 s while it wakes up.

### Self-hosting (any VPS)

The backend serves the built React app automatically when `frontend/dist` exists, so the
whole thing runs as **one Node process with no CORS or cookie configuration**. That is the
recommended setup.

```bash
# on the server
cd doctor-appointment-booking-system/frontend
npm ci && npm run build          # creates dist/

cd ../backend
npm ci
cp .env.production.example .env  # then edit it
# JWT_SECRET must be a strong random value or the app refuses to start
# HOST must be 0.0.0.0 (127.0.0.1 is not reachable from outside)
npm run seed:reset               # optional: load clean demo data
npm start                        # serves both API and UI on :5000
```

Verified behaviour of that build:

| Request | Result |
|---|---|
| `GET /`, `/login/doctor`, `/admin/users` | `200` + SPA shell (deep links work) |
| `GET /api/v1/health` | `200` JSON |
| `GET /api/v1/unknown` | `404` JSON |
| `GET /assets/*.css` | `200`, `Cache-Control: immutable` |

### Production checklist

- **`NODE_ENV=production`** — turns on `Secure` cookies, so **HTTPS is required** (plain HTTP
  would make the browser drop the login cookie).
- **`HOST=0.0.0.0`** — otherwise the port is only reachable from localhost.
- **`JWT_SECRET`** — unique and long; the app throws on startup if it is still the dev default.
- **`DB_PATH`** — point at a persistent disk/volume so appointments survive redeploys.
- **SPA fallback** — already handled by the backend. If you put nginx in front, use
  `deploy/nginx.conf.example` (it also reverse-proxies `/api`).

### If you host the UI on a different site than the API

The session cookie is `SameSite=Lax`, which means it is only sent **same-site**. Subdomains of
one domain (`app.example.com` + `api.example.com`) are fine; two unrelated domains are not.
In that case set `VITE_API_BASE_URL=https://api.example.com/api/v1` at build time and
`CLIENT_ORIGIN=https://yourdomain.com` on the API.

`VITE_*` variables are baked into the public JS bundle — never put secrets there.

---

## Environment variables

See `backend/.env.example` (development) and `backend/.env.production.example` (production).

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | `production` enables secure cookies + JWT secret check |
| `PORT` / `HOST` | `5000` / `127.0.0.1` | listener |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allow-list |
| `DB_PATH` | `data/appointments.db` | SQLite file (absolute or backend-relative) |
| `JWT_SECRET` | dev-only default | must be overridden in production |
| `JWT_EXPIRES_IN` | `7d` | token lifetime |
| `COOKIE_NAME` | `dat_token` | httpOnly cookie name |

No secret is ever sent to the browser.

---

## Roles at a glance

| Capability | Patient | Doctor | Admin |
|---|:--:|:--:|:--:|
| Browse doctors / availability | ✅ | ✅ | ✅ |
| Self-register | ✅ | ❌ | ❌ |
| Book / cancel own appointments | ✅ | — | ✅ |
| Accept, reject, complete, cancel assigned appointments | ❌ | ✅ | — |
| Manage own availability slots | ❌ | ✅ | — |
| View all appointments | ❌ | own only | ✅ |
| Create/edit/deactivate doctors, users, specializations | ❌ | ❌ | ✅ |

Enforced in two places: `authorizeRole()` on every route **and** service-level ownership checks
(a doctor can only act on appointments assigned to them — covered by tests).

Full endpoint reference: **[docs/api.md](docs/api.md)**
