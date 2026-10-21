# Doctor Appointment Booking System
## Overall Project Detail Document

**Type:** SEMP mini-project (full-stack web application)
**Location:** `Downloads/doctor-appointment-booking-system`
**Document generated:** 19 October 2026

---

## 1. Overview

CareConnect is a full-stack **Doctor Appointment Booking System**. It lets patients find a
doctor, view genuinely available time slots and book an appointment; lets doctors manage
their schedule and approve or decline booking requests; and gives an administrator full
control over doctors, users, specializations and every appointment in the clinic.

The system is built as three cooperating layers:

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser  —  React 18 + Vite + Tailwind CSS + React Router 6     │
└───────────────────────────┬──────────────────────────────────────┘
                            │  HTTP  (JSON, httpOnly session cookie)
┌───────────────────────────▼──────────────────────────────────────┐
│  REST API —  Node 22 + Express 4                                │
│  routes → validation → controllers → services → repositories     │
└───────────────────────────┬──────────────────────────────────────┘
                            │  SQL (parameterised queries)
┌───────────────────────────▼──────────────────────────────────────┐
│  Database —  SQLite file (backend/data/appointments.db)          │
└──────────────────────────────────────────────────────────────────┘
```

**Fictional data only.** Every doctor, patient, email address and appointment in the system
is generated demonstration data.

---

## 2. Objectives

1. Give patients a self-service way to discover doctors and book real, conflict-free slots.
2. Guarantee **no double booking**, even under simultaneous requests.
3. Keep each role strictly inside its own permissions, enforced server-side.
4. Run on an ordinary machine with **no database server to install**.
5. Be deployable as a single process with minimal configuration.

---

## 3. Technology Stack

| Layer | Technology | Why it was chosen |
|---|---|---|
| UI framework | React 18 (function components + hooks) | Component model, fast iteration |
| Build tool | Vite 5 | Instant dev server, simple production build |
| Styling | Tailwind CSS 3.4 | Consistent design without a separate CSS codebase |
| Routing | React Router 6 | Nested layouts and route guards |
| Server | Node.js 22, Express 4 (ESM) | Minimal, well-understood REST framework |
| Passwords | bcryptjs | Salted, slow hashing |
| Sessions | JWT in an **httpOnly cookie** | Token unreadable by JS (XSS) + `SameSite=Lax` (CSRF) |
| Hardening | helmet, CORS allow-list, express-rate-limit | Standard security headers and throttling |
| Validation | Hand-written per-payload validators | Precise `422` responses with field-level `details` |
| Database | **SQLite** via built-in `node:sqlite` | Zero-install, single file, no admin rights needed |
| Tests | `node:test` + `fetch` against a live server | Real end-to-end coverage, no extra dependency |

### 3.1 Important deviation: SQLite instead of MySQL

The reference architecture specifies **MySQL 8**. This machine has no administrator rights and
no Docker, and installing a database server was explicitly out of scope. The solution keeps
the architecture intact by shipping **one schema in two dialects**:

| File | Purpose |
|---|---|
| `database/schema.sqlite.sql` | Executed at startup — this is what actually runs |
| `database/schema.mysql.sql` | MySQL 8 reference DDL for a later server deployment |

Everything above the SQL — repositories, services, controllers, routes, the entire frontend —
is **identical for both**. Only the connection bootstrap differs. See `database/README.md`.

---

## 4. Database Design

10 tables. Relationships are declared with foreign keys, and `PRAGMA foreign_keys = ON` is set
on every connection.

| Table | Purpose | Key constraints |
|---|---|---|
| `users` | All accounts (patient / doctor / admin) | `email` **UNIQUE**, `role` CHECK, `is_active` |
| `specializations` | Medical specialties | `name` **UNIQUE**, `is_active` |
| `doctors` | Doctor profile joined to a user | FK → `users` (1:1), FK → `specializations`, `user_id` UNIQUE |
| `availability` | One row = one discrete bookable slot | `UNIQUE(doctor_id, available_date, start_time)`, nullable **`booked_appointment_id` UNIQUE** |
| `appointments` | One booking | FK → patient, doctor, slot; `status` CHECK |
| `appointments_audit` | Status-change history | Append-only trail |
| (+ lookup/supporting) | indexes and helpers | Supporting indexes on hot filters |

**The key idea — a nullable UNIQUE column as a claim.** `availability.booked_appointment_id`
references `appointments` and is `UNIQUE, NULL`. Because SQLite allows many `NULL`s but only
one instance of a value, at most one appointment can ever claim a given slot. The circular
reference (appointment → slot, slot → appointment) is resolved by claiming the slot *inside*
the same transaction that creates the appointment.

**Status flow**

```
PENDING ──accept──► CONFIRMED ──complete──► COMPLETED
   │                    │
   ├──reject──► REJECTED └──cancel──► CANCELLED
   └──cancel──► CANCELLED
```
`accept` keeps the slot claimed; every other terminal transition releases it so the slot
becomes bookable again.

---

## 5. Roles and Permissions

| Capability | Patient | Doctor | Admin |
|---|:--:|:--:|:--:|
| Browse doctors, profile and availability | ✅ | ✅ | ✅ |
| Self-register | ✅ | ❌ | ❌ |
| Book an appointment | ✅ | ❌ | ❌ |
| View own appointments | ✅ | own only | all |
| Cancel own appointment | ✅ | ✅ (assigned) | ✅ (any) |
| Accept / reject / complete | ❌ | ✅ | ❌ |
| Manage own availability slots | ❌ | ✅ | ❌ |
| Manage profile & change password | ✅ | ✅ | ✅ |
| Create / edit / deactivate doctors | ❌ | ❌ | ✅ |
| Activate / deactivate users | ❌ | ❌ | ✅ |
| Manage specializations | ❌ | ❌ | ✅ |
| View system-wide dashboard | ❌ | ❌ | ✅ |

**Enforced twice:** `authorizeRole()` guards every route, and services independently verify
ownership (a doctor can only act on appointments assigned to them). Hiding a button in the UI
is never the security boundary.

**Account lifecycle:** public registration *always* creates a `PATIENT`, even if a `role` field
is sent in the body (verified by test 2). Doctor and admin accounts are created by the admin —
`POST /api/v1/admin/doctors` is the only path to a doctor account.

---

## 6. Pages and User Flows

### 6.1 Public (no login)
| Route | What it does |
|---|---|
| `/` | Hero search + featured doctors |
| `/doctors` | Directory with name / specialization / date filters |
| `/doctors/:id` | Full profile, fee, qualifications, live slot grid, booking CTA |
| `/about`, `/contact` | Static information |
| `/register` | **Patient** self-signup |

### 6.2 Three isolated login portals
| Route | Audience |
|---|---|
| `/login/patient` | Patients (also offers signup) |
| `/login/doctor` | Doctors — "accounts are issued by the administrator" |
| `/login/admin` | Administrators |

Reached from the navbar **`Log in ▾`** dropdown and the footer **Portals** links; `/login`
redirects to `/login/patient`. Each portal is visually dedicated to one role, but the portal
is **cosmetic only** — the role always comes back from the database, so choosing the "Doctor"
page cannot grant doctor access.

### 6.3 Patient
`/patient/dashboard` (counts + next appointments) · `/appointments/book` (pick doctor → pick
slot → reason) · `/patient/appointments` (list + cancel with confirmation) ·
`/patient/profile` (details + change password)

### 6.4 Doctor
`/doctor/dashboard` (pending requests + totals) · `/doctor/appointments` (6 status filters with
**Accept / Reject / Complete / Cancel**) · `/doctor/availability` (add and deactivate slots) ·
`/doctor/profile` (specialization, qualification, experience, fee, description)

### 6.5 Administrator
`/admin/dashboard` (users by role, doctors, appointment status breakdown, slot status) ·
`/admin/users` (search, role filter, activate/deactivate) · `/admin/doctors` (create, edit,
deactivate) · `/admin/appointments` (all appointments, filterable) · `/admin/specializations`
(create, edit, toggle)

---

## 7. REST API

Base: `/api/v1` — full reference in **`docs/api.md`** (33 endpoints across 8 routers).

| Group | Endpoints |
|---|---|
| Health | `GET /health` |
| Auth | `register`, `login`, `logout`, `me` |
| Profile | `GET/PATCH /users/me` |
| Public | `doctors` list/profile/availability, `specializations` |
| Doctor | `GET/PATCH /doctor/profile`, 4 availability endpoints |
| Appointments | book, mine, cancel, 3 doctor endpoints |
| Admin | dashboard, users, appointments, doctors, specializations |

**Uniform envelopes.** Success: `{ "data": … }`. Failure: `{ "error": { code, message, details? } }`.
Status codes used: 200, 201, 400, 401, 403, 404, 409, 422, 429, 500.

---

## 8. Core Business Logic

### 8.1 Transaction-safe booking (the centrepiece)

Booking must never double-book a slot. The implementation:

```
BEGIN IMMEDIATE transaction
  1. UPDATE availability
        SET booked_appointment_id = <new id>
      WHERE id = ? AND booked_appointment_id IS NULL AND slot_status = 'AVAILABLE'
  2. If rows affected = 0  →  ROLLBACK  →  409 CONFLICT
  3. INSERT the appointment referencing that slot
COMMIT
```

`BEGIN IMMEDIATE` takes the write lock up front, so two concurrent requests for the same slot
are serialised, and the `UNIQUE, NULL` constraint on `booked_appointment_id` is the final
database-enforced guarantee.

**Verified:** two simultaneous requests for one slot produce **exactly one** `201` and one
`409` (test 9), and a deliberate second attempt returns `409` (test 8).

### 8.2 Availability rules
- A slot is bookable only if it is **in the future**, `AVAILABLE`, and unclaimed — filtered in
  SQL, not in JavaScript.
- Past slots disappear from the public directory automatically.
- Deactivating or editing a slot that has a live appointment is blocked.
- Slot uniqueness per doctor: `UNIQUE(doctor_id, available_date, start_time)` prevents a
  doctor from overlapping their own slots.

### 8.3 Status transitions
A single rules table drives all doctor actions:

| Action | From | To | Releases slot |
|---|---|---|---|
| `accept` | `PENDING` | `CONFIRMED` | no |
| `reject` | `PENDING` | `REJECTED` | yes |
| `complete` | `CONFIRMED` | `COMPLETED` | yes |
| `cancel` | `PENDING`/`CONFIRMED` | `CANCELLED` | yes |

Invalid transitions and past appointments are rejected with `409`; status changes are written
to `appointments_audit` for an audit trail.

---

## 9. Security Measures

| Threat | Countermeasure |
|---|---|
| XSS stealing a session | JWT in an **httpOnly** cookie — `document.cookie` cannot read it |
| CSRF | `SameSite=Lax` cookie; all mutations are `POST`/`PATCH`, never GET |
| Token interception in prod | `Secure` flag auto-enabled by `NODE_ENV=production` (HTTPS required) |
| Password theft | bcrypt with per-user salt; hashes never returned by any endpoint |
| Privilege escalation | Role checked by `authorizeRole()` **and** re-checked in services |
| Horizontal escalation | Ownership checks — cancel/act only on your own records |
| User enumeration | Identical error for unknown email and wrong password |
| Brute force | 100 auth attempts / 15 min / IP |
| Oversized payloads | JSON body capped at 100 KB |
| Injection | Parameterised SQL everywhere; no string concatenation of user input |
| Clickjacking / headers | helmet defaults; CORS restricted to `CLIENT_ORIGIN` |
| Weak secrets | App **refuses to start** in production with the default JWT secret |
| Verbose errors | 500 responses are generic; stack traces logged server-side only |

Input validation runs before the controller and returns `422` with per-field messages, so the
UI can highlight exactly which field is wrong.

---

## 10. Testing

**16 integration tests**, all passing (`cd backend && npm test`). They start the real server
against a throwaway database and exercise it over HTTP:

| # | Test | Verifies |
|---|---|---|
| 1 | Health endpoint reports seeded counts | Schema + seed integrity |
| 2 | Registration always creates a PATIENT | `role: "ADMIN"` in body is ignored |
| 3 | Wrong password → generic failure | No user enumeration |
| 4 | Public directory is searchable | Filtering works |
| 5 | Profile + availability readable | Public read paths |
| 6 | Protected routes reject anonymous calls | `401` everywhere it matters |
| 7 | A patient can book a slot | Happy path |
| 8 | **Same slot cannot be double-booked** | `409 CONFLICT` |
| 9 | **Concurrent requests → exactly one booking** | Transaction correctness |
| 10 | Patient cannot cancel another patient's record | `403` ownership check |
| 11 | Doctor can accept a pending appointment | `PENDING → CONFIRMED` |
| 12 | Doctor cannot act on another doctor's appointment | Role + ownership scope |
| 13 | Invalid input → controlled `422` | Validation layer |
| 14 | Admin dashboard counts match the data | Aggregation queries |
| 15 | Non-admin cannot reach admin dashboard | `403` role guard |
| 16 | Patient cancel releases the slot | Slot reappears as bookable |

**Manual/browser verification performed:** role isolation (a doctor hitting `/admin/dashboard`
is redirected and every admin API call returns `403`), deep-link reloads, cross-portal login
(patient credentials on the doctor page still land on the patient dashboard), and the
production static-serving path.

---

## 11. Project Structure

```
doctor-appointment-booking-system/
├── backend/
│   ├── data/                    SQLite file (generated, git-ignored)
│   ├── src/
│   │   ├── config/              env · database · seed
│   │   ├── middleware/          authenticate · authorizeRole · validateRequest · errorHandler
│   │   ├── repositories/        all SQL lives here
│   │   ├── services/            business rules + transactions
│   │   ├── controllers/         request/response shaping
│   │   ├── routes/              URL wiring + validation hooks
│   │   ├── validators/          per-payload validation
│   │   └── utils/               errors · jwt · password · http · dateTime
│   ├── tests/api.test.js        16 integration tests
│   ├── .env.example / .env.production.example
│   └── package.json
├── frontend/
│   └── src/
│       ├── app/                 App · routes · routeGuards
│       ├── layouts/             Public · Patient · Doctor · Admin
│       ├── pages/               public · auth · patient · doctor · admin
│       ├── components/          common · doctors · appointments
│       ├── services/            fetch-based API client (one per domain)
│       ├── context/AuthContext  session state
│       └── utils/               dateTime · validators · constants
├── database/
│   ├── schema.sqlite.sql        executed at startup
│   ├── schema.mysql.sql         MySQL 8 reference
│   └── README.md                dialect notes + portability explanation
├── deploy/nginx.conf.example    optional reverse proxy
├── docs/api.md                  full API reference
├── README.md                    quick start, deploy, credentials
└── .gitignore
```

**Layering rule:** a request travels `route → validate → controller → service → repository`.
Controllers never touch SQL, repositories never make business decisions, and services never
build HTTP responses. This is what keeps the SQL dialect swappable.

---

## 12. Running the Project

**Development** (two terminals, Node ≥ 22.5):
```bash
cd backend  && npm install && npm run dev      # API on :5000, auto-seeds
cd frontend && npm install && npm run dev      # UI on :5173, proxies /api
```
Open http://localhost:5173

**Tests:** `cd backend && npm test`

**Production** (single process — the backend also serves the built UI):
```bash
cd frontend && npm ci && npm run build
cd ../backend && npm ci
cp .env.production.example .env    # set JWT_SECRET, HOST=0.0.0.0, DB_PATH
npm start                          # serves API + UI on :5000
```

### Deployment notes
- The backend automatically serves `frontend/dist` when it exists, including **SPA fallback**
  so deep links like `/login/doctor` and `/admin/users` reload correctly. Verified: `/`,
  `/login/doctor`, `/admin/users` → `200` HTML; `/api/v1/health` → `200` JSON; unknown API
  routes → `404` JSON; hashed assets → `Cache-Control: immutable`.
- `NODE_ENV=production` turns on `Secure` cookies, so **HTTPS is required**.
- `HOST` must be `0.0.0.0` on a server; `127.0.0.1` is only reachable locally.
- `DB_PATH` should point at a persistent disk so appointments survive redeploys.
- Frontend and API must be **same-site** because the cookie is `SameSite=Lax`.
- Optional nginx config: `deploy/nginx.conf.example`.

---

## 13. Demo Data

Seeded automatically on first run (`npm run seed`, or `npm run seed:reset` to reload):

- **7** specializations
- **5** doctors (Pediatrics, General Medicine, Orthopedics, Dermatology, Cardiology)
- **10** patients, **1** administrator
- **330** availability slots
- **10** appointments spread across `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `REJECTED`

**Credentials**

| Role | Email | Password |
|---|---|---|
| Patient | `patient01@example.test` | `Patient@123` |
| Doctor | `asha.rao@clinic.test` | `Doctor@123` |
| Admin | `admin@clinic.test` | `Admin@123` |

Slots are generated relative to the current date and filtered to the future, so the demo
never shows already-past appointments.

---

## 14. Known Limitations

1. Single SQLite file — fine for a demo, not for concurrent multi-server deployment.
2. No email/SMS reminders or password reset flow.
3. No pagination on list endpoints (datasets are small by design).
4. Time slots are fixed 30-minute blocks created one at a time (no bulk/recurring generator).
5. No appointment rescheduling — cancel and rebook instead.

## 15. Possible Future Work

- Password reset by email, and account e-mail verification.
- Recurring availability rules ("every Monday 09:00–13:00").
- Calendar view for doctors, with drag-and-drop slot creation.
- Reminders via email/SMS, and an `.ics` calendar file per appointment.
- Swap SQLite for MySQL/Postgres by changing only the connection bootstrap — the schema and
  repositories are already written to make that a small change.
- Rating/review system for doctors, and waiting-list auto-fill when a slot is released.
