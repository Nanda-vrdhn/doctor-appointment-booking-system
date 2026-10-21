# REST API Reference

Base URL: **`/api/v1`**

- Authentication uses an **httpOnly JWT cookie** (`dat_token`, `SameSite=Lax`) — there is no
  bearer token to copy. Send `credentials: 'include'` from the browser; use a cookie jar/curl
  `-c/-b` from scripts.
- All responses are JSON.
- Every endpoint except registration, login, the public doctor directory, specializations and
  health requires an authenticated session.

## Envelopes

**Success**
```json
{ "data": { "...": "payload" } }
```

**Error**
```json
{ "error": { "code": "CONFLICT", "message": "This slot was just booked." } }
```
Validation errors add `details` (a map of field → message):
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please fix the highlighted fields.",
             "details": { "email": "Enter a valid email address." } } }
```

| Status | Meaning |
|---|---|
| `400` | Malformed request / unknown action |
| `401` | Not authenticated (missing/expired/invalid cookie) |
| `403` | Authenticated but wrong role, or acting on someone else's record |
| `404` | Resource does not exist |
| `409` | Conflict — e.g. slot already booked, appointment in a non-cancellable state |
| `422` | Validation failed (see `error.details`) |
| `429` | Rate limited (login/registration: 100 requests / 15 min / IP) |
| `500` | Internal error — message is always generic, details logged server-side only |

---

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness + row counts for every table |

```json
{ "data": { "status": "ok", "time": "2026-10-19T15:44:00.000Z",
            "db": { "users": 16, "doctors": 5, "appointments": 11, "availability": 330 } } }
```

---

## Auth — `/auth`

Rate limited to **100 requests / 15 minutes / IP**.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create a **patient** account |
| POST | `/auth/login` | — | Sign in, sets the session cookie |
| POST | `/auth/logout` | user | Clears the session cookie |
| GET | `/auth/me` | user | Current user from the session |

### POST `/auth/register`
```json
{ "fullName": "Riya Sharma", "email": "riya@example.test",
  "password": "Passw0rd1", "phone": "9000000000" }
```
- `phone` optional.
- Password: minimum 8 characters, at least one letter and one digit.
- **`role` in the body is ignored** — public registration always creates `PATIENT`.

`201` → `{ "data": { "user": { "userId": 11, "role": "PATIENT", ... } } }`

### POST `/auth/login`
```json
{ "email": "asha.rao@clinic.test", "password": "Doctor@123" }
```
`200` → `{ "data": { "user": { "userId": 2, "role": "DOCTOR", ... } } }` **+ `Set-Cookie`**

Failures return a deliberately generic message for both wrong email and wrong password.

### GET `/auth/me`
```json
{ "data": { "user": { "userId": 1, "fullName": "Riya Sharma", "role": "PATIENT",
                      "email": "patient01@example.test", "isActive": true } } }
```

---

## Profile — `/users` *(any authenticated user)*

| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Own profile |
| PATCH | `/users/me` | Update name/phone, optionally change password |

```json
{ "fullName": "Riya Sharma", "phone": "9000000000",
  "currentPassword": "Passw0rd1", "newPassword": "NewPass0rd1" }
```
Changing a password requires the correct `currentPassword`.

---

## Public directory — `/doctors`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/doctors` | — | Search the directory |
| GET | `/doctors/:doctorId` | — | Single profile |
| GET | `/doctors/:doctorId/availability` | — | Bookable slots only |

Query parameters for `GET /doctors`:

| Param | Example | Notes |
|---|---|---|
| `name` | `asha` | Partial, case-insensitive match on doctor name |
| `specializationId` | `1` | Exact specialization |
| `date` | `2026-10-21` | Only doctors with open slots that date |

```json
{ "data": { "doctors": [ {
  "doctor_id": 1, "full_name": "Dr. Asha Rao", "specialization_name": "General Medicine",
  "qualification": "MBBS, MD", "experience_years": 8, "consultation_fee": 500,
  "doctor_active": true, "bookable_slots": 35 } ] } }
```

`GET /doctors/:id/availability` returns only **future**, `AVAILABLE`, not-yet-claimed slots
grouped by date — past and booked slots are filtered out in SQL.

---

## Specializations — `/specializations`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/specializations` | — | Active specializations (used by search filters) |

---

## Doctor session — `/doctor` *(role: `DOCTOR`)*

| Method | Path | Description |
|---|---|---|
| GET | `/doctor/profile` | Own professional profile |
| PATCH | `/doctor/profile` | Update it |

```json
{ "specializationId": 1, "qualification": "MBBS, MD",
  "experienceYears": 8, "consultationFee": 500, "description": "..." }
```
All fields optional.

---

## Availability management — `/doctor/availability` *(role: `DOCTOR`)*

| Method | Path | Description |
|---|---|---|
| GET | `/doctor/availability?from=&to=` | Own slots (incl. booked ones) |
| POST | `/doctor/availability` | Create one slot |
| PATCH | `/doctor/availability/:id` | Edit time / mark unavailable |
| PATCH | `/doctor/availability/:id/deactivate` | Release it |

```json
{ "date": "2026-10-21", "startTime": "09:00", "endTime": "09:30" }
```
`slotStatus`: `AVAILABLE` | `UNAVAILABLE`. A slot with a `booked_appointment_id` cannot be
edited or deactivated while the appointment is live.

---

## Appointments — `/appointments`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/appointments` | `PATIENT` | Book a slot |
| GET | `/appointments/mine` | `PATIENT` | Own appointments |
| PATCH | `/appointments/:id/cancel` | `PATIENT` / `ADMIN` | Cancel own (or any, if admin) |
| GET | `/appointments/doctor/appointments?status=` | `DOCTOR` | Appointments assigned to me |
| GET | `/appointments/doctor/appointments/:id` | `DOCTOR` | One of mine |
| PATCH | `/appointments/doctor/appointments/:id/status` | `DOCTOR` | Accept / reject / complete / cancel |

### POST `/appointments` — transaction-safe booking
```json
{ "availabilityId": 136, "reason": "Follow-up for fever" }
```
`201` → `{ "data": { "appointment": { "appointmentId": 12, "status": "PENDING", ... } } }`

The booking runs inside a single `BEGIN IMMEDIATE` transaction:

1. claim the slot with `UPDATE ... WHERE booked_appointment_id IS NULL` (or `slot_status = 'AVAILABLE'`),
2. read the affected row count — if `0`, someone else won the race,
3. insert the appointment with the claimed `booked_appointment_id`.

The `UNIQUE, NULL` column on `booked_appointment_id` is the database-enforced claim, so
concurrent requests for one slot always yield **exactly one** success and `409 CONFLICT`
for the rest (covered by tests 8 and 9).

Other booking rejections: slot missing/past → `404`/`422`; doctor deactivated → `409
DOCTOR_INACTIVE`; not a patient → `403`.

### PATCH `/appointments/doctor/appointments/:id/status`
```json
{ "action": "accept" }
```

| `action` | From | To | Releases slot |
|---|---|---|---|
| `accept` | `PENDING` | `CONFIRMED` | no |
| `reject` | `PENDING` | `REJECTED` | yes |
| `complete` | `CONFIRMED` | `COMPLETED` | yes |
| `cancel` | `PENDING` or `CONFIRMED` | `CANCELLED` | yes |

Any other transition → `409` with the current status in the message. Only the **assigned
doctor** may act, and never on a past appointment.

### Patient cancellation
`PATCH /appointments/:id/cancel` — only the owner (or an admin), only `PENDING`/`CONFIRMED`,
never in the past; releasing the slot makes it bookable again.

**Statuses:** `PENDING` → `CONFIRMED` / `REJECTED` / `CANCELLED` → `COMPLETED`

---

## Admin — `/admin` *(role: `ADMIN`)*

| Method | Path | Description |
|---|---|---|
| GET | `/admin/dashboard` | Counts: users by role, doctors, appointments by status, slots |
| GET | `/admin/users?search=&role=` | List users; `role` ∈ `PATIENT`\|`DOCTOR`\|`ADMIN` |
| PATCH | `/admin/users/:id/status` | `{ "isActive": false }` — blocks login without deleting data |
| GET | `/admin/appointments?status=` | Every appointment in the system |
| POST | `/admin/doctors` | **Create a doctor account** |
| PATCH | `/admin/doctors/:id` | Edit professional fields |
| PATCH | `/admin/doctors/:id/status` | `{ "isActive": false }` — hides from directory, blocks booking |
| GET | `/admin/specializations` | List (incl. inactive) |
| POST | `/admin/specializations` | Create |
| PATCH | `/admin/specializations/:id` | Rename / edit description |
| PATCH | `/admin/specializations/:id/status` | `{ "isActive": false }` |

### POST `/admin/doctors`
```json
{ "fullName": "Dr. Meera Das", "email": "meera.das@clinic.test",
  "password": "TempPass123", "phone": "9000000000", "specializationId": 4,
  "qualification": "MBBS, MD", "experienceYears": 6, "consultationFee": 650,
  "description": "..." }
```
**This is the only way a doctor account is created** — there is no public doctor signup.

`403` example for a non-admin calling any of these:
```json
{ "error": { "code": "FORBIDDEN",
             "message": "You do not have permission to perform this action." } }
```

---

## Session & security notes

| Concern | Implementation |
|---|---|
| Token transport | httpOnly cookie — JavaScript can never read it (XSS mitigation) |
| CSRF | `SameSite=Lax` + state-changing routes are `PATCH`/`POST` only |
| Transport | `Secure` automatically set when `NODE_ENV=production` (requires HTTPS) |
| Passwords | bcrypt with a per-user salt; hashes are never returned by any endpoint |
| Authorization | `authorizeRole()` on every route **plus** ownership checks inside services |
| Enumeration | Same login error for unknown email and wrong password |
| Brute force | 100 auth attempts / 15 min / IP |
| Payloads | JSON body limited to 100 KB; per-field validation with 422 + `details` |
| Headers | `helmet`, CORS restricted to `CLIENT_ORIGIN` with credentials |
