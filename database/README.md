# Database

The Doctor Appointment Booking System stores data in a relational database with
these tables: `users`, `specializations`, `doctors`, `availability`, and
`appointments`.

## Which engine is used?

| File | Engine | Used by the app? |
|---|---|---|
| `schema.sqlite.sql` | SQLite (local file `backend/data/appointments.db`) | **Yes** — zero-install local development |
| `schema.mysql.sql` | MySQL 8 | No — kept as the deployment reference |

The architecture document specifies MySQL. This project deliberately runs on a
local **SQLite** file instead because the development machine has no MySQL
server and none can be installed without administrator rights. The two schemas
are intentionally kept structurally identical (same columns, foreign keys,
unique constraints, indexes) so the application can be moved to a hosted
MySQL/PostgreSQL server by changing only the connection configuration.

> This is a documented change of the data layer. All application code, the REST
> API, and the booking/authorization rules are unaffected.

## Entity relationships

```text
users (1) ─────── (0..1) doctors
  │                       │
  │                       ├────── (many) availability   (each row = one slot)
  │                       └────── (many) appointments
  └──────────────── (many) appointments (patient)
specializations (1) ──── (many) doctors
```

## Slot claiming (double-booking prevention)

Each `availability` row is a single discrete slot with a nullable,
`UNIQUE` `booked_appointment_id` pointer. Booking runs in a transaction:

1. `BEGIN IMMEDIATE` (acquires the write lock)
2. load the slot
3. verify it is `AVAILABLE`, active, in the future, and belongs to an active doctor
4. verify `booked_appointment_id IS NULL`
5. insert the `PENDING` appointment
6. set `availability.booked_appointment_id` = the new appointment id
7. `COMMIT`

The `UNIQUE` constraint is the real guarantee — even if two requests arrive at
once, only one can claim the slot. Cancelling or rejecting an appointment
releases the claim (`booked_appointment_id = NULL`) in the same transaction.

## Demo data (fictional)

Seeded by `backend/src/config/seed.js` (`npm run seed`). Everything is invented:

- 7 specializations
- 5 doctors
- 10 patients
- 1 admin
- future slots, plus a mix of `PENDING` / `CONFIRMED` / `REJECTED` /
  `COMPLETED` / `CANCELLED` appointments

### Demo credentials

| Role | Email | Password |
|---|---|---|
| Patient | `patient01@example.test` … `patient10@example.test` | `Patient@123` |
| Doctor | `asha.rao@clinic.test`, `vikram.sen@clinic.test`, `meera.das@clinic.test`, `arjun.nair@clinic.test`, `kavya.iyer@clinic.test` | `Doctor@123` |
| Admin | `admin@clinic.test` | `Admin@123` |

These are **local-development credentials only** and must never be reused in
production.
