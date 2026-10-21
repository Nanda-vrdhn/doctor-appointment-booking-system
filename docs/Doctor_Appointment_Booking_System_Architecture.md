# Doctor Appointment Booking System
## SEMP Mini-Project: Frontend, Backend, and Database Architecture

**Document purpose:** Implementation-ready architecture plan for a college mini-project based on the provided *Doctor Appointment Booking System Prompt and Project Requirements*.

**Project type:** Responsive full-stack web application  
**Frontend:** React, JavaScript, Tailwind CSS  
**Backend:** Node.js, Express.js, REST APIs  
**Database:** MySQL  
**User roles:** Patient, Doctor, Admin

> **Scope note:** The features and baseline technology choices below follow the supplied project document. Items marked **Recommended design choice** add implementation detail to make the system safer, easier to test, and more reliable; they are not stated as mandatory details in the source document.

---

## 1. Project objectives and scope

The system allows patients to search doctors, review profiles and available time slots, request appointments, check appointment status, and cancel eligible bookings. Doctors can manage their profiles and schedules, review requests, accept or reject them, and mark visits completed or cancelled. Administrators manage doctor profiles, users, specializations, appointments, and basic statistics.

### Required user capabilities

| Role | Main capabilities |
|---|---|
| Patient | Register/login; update profile; search/filter doctors by name, specialization, and availability; view qualifications, experience, fees, and slots; book appointments with a visit reason; view appointment history/status; cancel eligible appointments |
| Doctor | Log in; view daily/upcoming appointments; accept/reject requests; manage dates and slots; update profile; mark appointments completed or cancelled |
| Admin | View patient/doctor/appointment counts; add, edit, or deactivate doctors; view/manage users; review appointments/statuses; manage specializations; view basic reports |

### Required pages

- Home page with navigation, welcome message, doctor search, and featured doctors
- Patient registration and login
- Doctor login and dashboard
- Admin login and dashboard
- Doctor directory and doctor profile
- Appointment booking form
- My Appointments
- Profile and settings
- About Us and Contact Us

---

## 2. Recommended high-level architecture

Use a **three-layer architecture** with a clear API boundary. The browser must never connect directly to MySQL.

```text
┌─────────────────────────────────────────────────────┐
│                    PRESENTATION                     │
│ React + Tailwind CSS                                │
│ Public pages | Patient dashboard | Doctor dashboard │
│ Admin dashboard | Forms | API client                │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS / JSON REST API
                         ▼
┌─────────────────────────────────────────────────────┐
│                    APPLICATION                      │
│ Node.js + Express.js                                │
│ Routes → Authentication/Role Middleware →          │
│ Controllers → Services → Validation                 │
│ Booking rules | Availability checks | Error handler │
└────────────────────────┬────────────────────────────┘
                         │ Parameterized SQL
                         ▼
┌─────────────────────────────────────────────────────┐
│                       DATA                          │
│ MySQL                                               │
│ users | doctors | specializations | availability   │
│ appointments | optional audit_events               │
│ Foreign keys | unique constraints | indexes         │
└─────────────────────────────────────────────────────┘
```

### Architecture rules

1. **Frontend:** responsible for presentation, client-side usability, and calling the API.
2. **Backend:** the authority for authentication, permissions, validation, appointment rules, and status transitions.
3. **Database:** preserves relationships and data integrity with primary keys, foreign keys, unique constraints, indexes, and transactions.
4. Do not trust a role, patient ID, doctor ID, fee, appointment status, or slot status sent by the browser without server-side verification.
5. Keep database credentials, session secrets, and other secrets in environment variables.
6. Use fictional demonstration data only. Do not put real patient medical information into the college demo.

---

## 3. Frontend architecture

### 3.1 Recommended frontend stack

- React
- JavaScript
- Tailwind CSS
- React Router for page navigation (**recommended design choice**)
- Fetch API or Axios for HTTP requests (**recommended design choice**)
- React Context or a small state store for authenticated-user/session state (**recommended design choice**)

Avoid adding a large state-management library unless the implementation genuinely needs it.

### 3.2 Page and route plan

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Home, doctor search, featured doctors |
| `/register` | Public | Patient registration |
| `/login` | Public | Login entry page or role-aware login |
| `/doctors` | Public | Search/filter doctor directory |
| `/doctors/:doctorId` | Public | Doctor profile and available slots |
| `/about` | Public | About page |
| `/contact` | Public | Contact page |
| `/patient/dashboard` | Patient | Summary and upcoming appointments |
| `/patient/appointments` | Patient | Appointment history and status |
| `/patient/profile` | Patient | Profile/settings |
| `/appointments/book` | Patient | Booking form; doctor/slot can be passed as route state or query parameters |
| `/doctor/dashboard` | Doctor | Daily and upcoming appointment summary |
| `/doctor/appointments` | Doctor | Requests and appointment management |
| `/doctor/availability` | Doctor | Manage available dates and slots |
| `/doctor/profile` | Doctor | Update professional profile |
| `/admin/dashboard` | Admin | Counts and basic statistics |
| `/admin/doctors` | Admin | Add/edit/deactivate doctors |
| `/admin/users` | Admin | View/manage registered users |
| `/admin/appointments` | Admin | Review all appointments |
| `/admin/specializations` | Admin | Manage specializations |

**Important:** Hiding a route or button in React is not security. The backend must enforce the same permissions.

### 3.3 Component structure

Reusable UI components:

- `AppLayout`, `Navbar`, `Footer`
- `ProtectedRoute` (navigation convenience only; not the security boundary)
- `RoleHomeRedirect`
- `DoctorCard`, `DoctorSearchFilters`, `DoctorProfileHeader`
- `AvailabilityCalendar`, `TimeSlotPicker`
- `AppointmentForm`, `AppointmentTable`, `AppointmentStatusBadge`
- `FormField`, `LoadingSpinner`, `EmptyState`, `ErrorMessage`
- `ConfirmDialog`, `Pagination` (if required)

### 3.4 Frontend folder structure

```text
frontend/
├── public/
│   └── healthcare-logo.svg
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── routes.jsx
│   │   └── routeGuards.jsx
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── doctors/
│   │   └── appointments/
│   ├── layouts/
│   │   ├── PublicLayout.jsx
│   │   ├── PatientLayout.jsx
│   │   ├── DoctorLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── patient/
│   │   ├── doctor/
│   │   └── admin/
│   ├── services/
│   │   ├── apiClient.js
│   │   ├── authService.js
│   │   ├── doctorService.js
│   │   ├── availabilityService.js
│   │   └── appointmentService.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   ├── utils/
│   │   ├── dateTime.js
│   │   └── validators.js
│   ├── styles/
│   └── main.jsx
├── .env.example
├── package.json
└── README.md
```

### 3.5 UI and accessibility requirements

- Use a professional blue-and-white healthcare theme and a consistent healthcare logo/navigation.
- Use responsive layouts for mobile, tablet, and desktop.
- Show doctors in cards and appointments in readable tables or calendar views.
- Use consistent status labels: **Pending, Confirmed, Completed, Cancelled**. A rejected request may be represented as **Rejected** so the patient can distinguish it from cancellation.
- Add form validation, loading indicators, confirmation dialogs, helpful error messages, and empty states.
- Support keyboard navigation, visible focus indicators, labels for inputs, and readable text contrast.
- Do not communicate appointment status by color alone; include text labels.

---

## 4. Backend architecture

### 4.1 Request flow

```text
HTTP request
   ↓
Express route
   ↓
Authentication middleware
   ↓
Role/ownership authorization middleware
   ↓
Request validation and normalization
   ↓
Controller (HTTP input/output)
   ↓
Service (business rules and transactions)
   ↓
Repository / parameterized SQL
   ↓
MySQL
   ↓
Consistent JSON response or error handler
```

### 4.2 Backend folder structure

```text
backend/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── env.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── doctors.routes.js
│   │   ├── specializations.routes.js
│   │   ├── availability.routes.js
│   │   ├── appointments.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── doctor.service.js
│   │   ├── availability.service.js
│   │   ├── appointment.service.js
│   │   └── admin.service.js
│   ├── repositories/
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorizeRole.js
│   │   ├── validateRequest.js
│   │   └── errorHandler.js
│   ├── validators/
│   ├── utils/
│   └── tests/
├── migrations/
├── seeders/
├── .env.example
├── package.json
└── README.md
```

### 4.3 Backend responsibilities

- **Authentication:** register patients, verify credentials, create and destroy authenticated sessions/tokens.
- **Authorization:** restrict actions by role and record ownership.
- **Doctor directory:** search/filter by name, specialization, and availability; return profile information.
- **Availability:** create, edit, and deactivate a doctor's available slots; reject invalid or conflicting slots.
- **Appointments:** validate slot, create booking, list bookings for the correct user, and enforce allowed status transitions.
- **Administration:** manage doctors, users, specializations, appointments, and summary counts.
- **Error handling:** return predictable JSON errors without exposing stack traces, SQL details, or secrets.

---

## 5. Database design

The source document requires `Users`, `Doctors`, `Availability`, and `Appointments`, with primary keys, foreign keys, constraints, and indexes. The following adds a `Specializations` table to support the required admin feature.

### 5.1 Entity relationships

```text
USERS (1) ───────── (0..1) DOCTORS
  │                         │
  │                         ├──────── (many) AVAILABILITY
  │                         │
  │                         └──────── (many) APPOINTMENTS
  │                                      ▲
  └──────────────── (many) APPOINTMENTS ─┘
                         patient

SPECIALIZATIONS (1) ───── (many) DOCTORS
```

- One user account has one role: `PATIENT`, `DOCTOR`, or `ADMIN`.
- A doctor profile is associated with a user account.
- A doctor has many availability slots.
- A patient can have many appointments.
- A doctor can have many appointments over time.
- A specialization can be assigned to many doctors.

### 5.2 Recommended MySQL schema

The SQL below is a starting migration for MySQL 8.0+. Adjust lengths and constraints to match the final implementation.

```sql
CREATE DATABASE IF NOT EXISTS doctor_appointment_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE doctor_appointment_db;

CREATE TABLE users (
  user_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(25),
  role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_active (role, is_active)
) ENGINE=InnoDB;

CREATE TABLE specializations (
  specialization_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE doctors (
  doctor_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  specialization_id BIGINT UNSIGNED NOT NULL,
  qualification VARCHAR(200) NOT NULL,
  experience_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
  consultation_fee DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_user
    FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_doctors_specialization
    FOREIGN KEY (specialization_id)
    REFERENCES specializations(specialization_id),
  CONSTRAINT chk_doctor_fee CHECK (consultation_fee >= 0),
  INDEX idx_doctors_specialization_active
    (specialization_id, is_active),
  INDEX idx_doctors_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE availability (
  availability_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  doctor_id BIGINT UNSIGNED NOT NULL,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_status ENUM('AVAILABLE', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_availability_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
  CONSTRAINT chk_availability_time CHECK (end_time > start_time),
  CONSTRAINT uq_doctor_slot UNIQUE
    (doctor_id, available_date, start_time, end_time),
  INDEX idx_availability_lookup
    (doctor_id, available_date, slot_status, start_time)
) ENGINE=InnoDB;

CREATE TABLE appointments (
  appointment_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id BIGINT UNSIGNED NOT NULL,
  doctor_id BIGINT UNSIGNED NOT NULL,
  availability_id BIGINT UNSIGNED NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  status ENUM(
    'PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'
  ) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_appointments_patient
    FOREIGN KEY (patient_id) REFERENCES users(user_id),
  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id),
  CONSTRAINT fk_appointments_availability
    FOREIGN KEY (availability_id)
    REFERENCES availability(availability_id),
  INDEX idx_appointments_patient_date
    (patient_id, appointment_date, appointment_time),
  INDEX idx_appointments_doctor_date_status
    (doctor_id, appointment_date, status),
  INDEX idx_appointments_status_created (status, created_at)
) ENGINE=InnoDB;
```

### 5.3 Important schema and integrity notes

1. **Role correctness:** application logic must verify that a patient ID belongs to a `PATIENT` user and a doctor profile belongs to a `DOCTOR` user. Foreign keys alone do not enforce those role relationships.
2. **Availability model:** the schema above treats one availability row as one bookable slot. If the UI instead stores a long time range, generate discrete slots on the server or use a separate slot table.
3. **Prevent overlapping availability:** the unique constraint prevents identical slots, but not all overlapping time ranges. The service must check for overlaps when a doctor creates or edits availability.
4. **Prevent double-booking:** do not rely only on checking availability before inserting. Concurrent requests can pass the same check. Use a transaction and a database-enforced claim/unique key strategy for each discrete slot.
5. **Recommended robust option:** make each row in `availability` a discrete bookable slot and add a nullable `booked_appointment_id` pointer with a unique constraint, or use a separate `appointment_slot_claims` table keyed by `availability_id`. In a transaction, lock the slot row (`SELECT ... FOR UPDATE`), verify it is bookable, claim it, and create the appointment. Ensure cancelled/rejected bookings release the claim correctly. This is safer than relying on an application-only query.
6. The supplied requirements say the same doctor cannot have overlapping active appointments. If using arbitrary appointment start/end times rather than discrete slots, implement interval-overlap checks under a doctor/date lock or another database-safe serialization strategy.
7. MySQL `CHECK` constraints are enforced in supported modern MySQL versions; test constraints against the exact database version used in the lab.
8. Use UTC consistently for timestamps. Appointment dates and times should follow the clinic's configured local time zone; document the choice.

### 5.4 Suggested status lifecycle

```text
PENDING ──doctor accepts──> CONFIRMED ──visit ends──> COMPLETED
   │                            │
   ├──doctor rejects──> REJECTED │
   │                            └──eligible cancellation──> CANCELLED
   └──patient cancels eligible request───────────────> CANCELLED
```

Recommended rules:
- Only the assigned doctor can accept or reject a pending appointment.
- Only the assigned doctor can mark a confirmed appointment completed.
- Patients can cancel only their own eligible future appointments.
- Admin can review/manage appointments according to documented policy.
- A completed or rejected appointment cannot be silently changed back to pending.
- When a booking is cancelled or rejected, release its slot claim in the same transaction if the slot is intended to be reusable.

---

## 6. REST API design

Use JSON request/response bodies and a consistent prefix such as `/api/v1`. The endpoint list below is a recommended design derived from the required workflows.

### 6.1 Authentication and profile

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a patient |
| `POST` | `/api/v1/auth/login` | Public | Authenticate a user |
| `POST` | `/api/v1/auth/logout` | Authenticated | End session / invalidate refresh token |
| `GET` | `/api/v1/auth/me` | Authenticated | Return current user and role |
| `GET` | `/api/v1/users/me` | Authenticated | Read own profile |
| `PATCH` | `/api/v1/users/me` | Authenticated | Update permitted profile fields |

Do not allow public registration to create an Admin or Doctor account. Doctor/admin accounts should be provisioned by an authorized process.

### 6.2 Doctors and specializations

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/doctors` | Public | Search/filter doctors |
| `GET` | `/api/v1/doctors/:doctorId` | Public | View a doctor profile |
| `GET` | `/api/v1/doctors/:doctorId/availability` | Public | View available slots |
| `PATCH` | `/api/v1/doctor/profile` | Doctor | Update own professional profile |
| `GET` | `/api/v1/specializations` | Public | List active specializations |
| `POST` | `/api/v1/admin/specializations` | Admin | Create specialization |
| `PATCH` | `/api/v1/admin/specializations/:id` | Admin | Update specialization |
| `DELETE` | `/api/v1/admin/specializations/:id` | Admin | Prefer deactivate rather than hard-delete if in use |

Suggested doctor query parameters: `name`, `specializationId`, `date`, `page`, `limit`.

### 6.3 Availability

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/doctor/availability` | Doctor | List own availability |
| `POST` | `/api/v1/doctor/availability` | Doctor | Add slot(s) |
| `PATCH` | `/api/v1/doctor/availability/:id` | Doctor | Edit an unbooked slot |
| `PATCH` | `/api/v1/doctor/availability/:id/deactivate` | Doctor | Mark slot unavailable |

The server must confirm that the availability record belongs to the authenticated doctor and that the time/date is valid.

### 6.4 Appointments

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/appointments` | Patient | Book a slot |
| `GET` | `/api/v1/appointments/mine` | Patient | List own appointments |
| `GET` | `/api/v1/doctor/appointments` | Doctor | List assigned appointments |
| `GET` | `/api/v1/doctor/appointments/:id` | Assigned doctor | View appointment details |
| `PATCH` | `/api/v1/doctor/appointments/:id/status` | Assigned doctor | Accept/reject/complete/cancel as allowed |
| `PATCH` | `/api/v1/appointments/:id/cancel` | Owning patient, or authorized admin | Cancel eligible booking |
| `GET` | `/api/v1/admin/appointments` | Admin | Review/filter all appointments |

### 6.5 Admin and dashboard

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Admin | Patient, doctor, appointment counts |
| `GET` | `/api/v1/admin/users` | Admin | Search/view users |
| `PATCH` | `/api/v1/admin/users/:id/status` | Admin | Activate/deactivate a user |
| `POST` | `/api/v1/admin/doctors` | Admin | Create doctor account/profile |
| `PATCH` | `/api/v1/admin/doctors/:id` | Admin | Edit doctor profile |
| `PATCH` | `/api/v1/admin/doctors/:id/status` | Admin | Activate/deactivate doctor |

### 6.6 Example booking request

```http
POST /api/v1/appointments
Content-Type: application/json
```

```json
{
  "availabilityId": 42,
  "reason": "Routine consultation"
}
```

The server derives `patient_id` from the authenticated session/token. It must not trust a patient ID supplied by the browser. The server loads the selected slot and obtains the doctor/date/time from the database, verifies the slot is available, and creates the pending appointment in a transaction.

### 6.7 Response and error conventions

Successful response example:

```json
{
  "data": {
    "appointmentId": 123,
    "status": "PENDING"
  }
}
```

Error response example:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "This time slot is no longer available."
  }
}
```

Recommended HTTP statuses: `200` success, `201` created, `400` malformed/invalid request, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflicting booking/state, `422` validation failure if used consistently, and `500` unexpected server error. Do not return internal exception messages to users.

---

## 7. Transaction-safe appointment booking

This is the most important business rule in the project: two active appointments must not occupy the same doctor's time slot.

### Recommended transaction workflow

1. Authenticate the patient and verify the account is active.
2. Validate the request and require an `availabilityId`.
3. Begin a database transaction.
4. Select the slot row by ID using `SELECT ... FOR UPDATE`.
5. Confirm the slot exists, is active/available, is in the future, and belongs to an active doctor.
6. Confirm no active appointment already claims the slot.
7. Create the appointment with `PENDING` status and the slot's doctor/date/time from the database.
8. Claim/mark the slot as booked using a database-enforced unique claim strategy.
9. Commit the transaction.
10. If any check or insert fails, roll back and return a useful conflict/error response.

**Concurrency requirement:** two simultaneous requests must not both succeed for the same slot. The database constraint/claim and transaction—not only a frontend disabled button—must enforce this.

### Booking pseudocode

```text
bookAppointment(authenticatedPatient, availabilityId, reason):
    validate patient role, account status, and reason
    BEGIN TRANSACTION
        slot = SELECT availability row FOR UPDATE
        if slot missing, unavailable, or in the past:
            ROLLBACK; return conflict
        if slot already claimed by an active appointment:
            ROLLBACK; return conflict
        create PENDING appointment using slot's database values
        claim slot using unique database key
    COMMIT
    return created appointment
```

For cancellation/rejection, update appointment status and release the claim atomically where the product policy permits slot reuse. Add tests for simultaneous booking attempts.

---

## 8. Authentication and security plan

The source document explicitly requires hashed passwords, server-side role-based access, input validation/sanitization, secure session/token handling, environment variables, and protection of patient/doctor information.

### Required safeguards

- Hash passwords using a suitable password-hashing algorithm such as **Argon2id** or **bcrypt**; never store plaintext passwords.
- Use secure, HTTP-only cookies for a server-managed session, or implement access/refresh tokens carefully. For a browser app, prefer HTTP-only, `Secure` cookies in production and configure CSRF protection when cookie authentication is used.
- Enforce authorization on every protected API route.
- Check record ownership: a patient can only read/cancel their own appointments; a doctor can only manage assigned appointments and their own availability/profile.
- Validate and normalize inputs on the server; use parameterized SQL to prevent SQL injection.
- Apply request size limits and rate limits to authentication endpoints (**recommended design choice**).
- Configure CORS to allow only the intended frontend origin in production.
- Store secrets in `.env` locally and a secure secret manager/environment configuration in deployment. Never commit real `.env` files.
- Use HTTPS in deployment.
- Return generic login failures and avoid revealing whether an email is registered.
- Do not log passwords, authentication tokens, or sensitive visit reasons.
- Use fictional data in screenshots, demos, and seed files.
- Keep dependencies updated and handle errors centrally.

### Example `.env.example`

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_NAME=doctor_appointment_db
DB_USER=your_local_db_user
DB_PASSWORD=replace_me

SESSION_SECRET=replace_with_a_long_random_secret
```

These are placeholders only. Use a strong unique secret locally and never put production credentials into a repository.

---

## 9. Demo data plan

The source document asks for at least **five fictional doctors**, **ten fictional patients**, multiple appointment statuses, and both available and unavailable slots. Clearly label these as demonstration data.

### Suggested doctors (fictional)

| Doctor demo name | Specialization | Qualification | Experience | Fee |
|---|---|---|---:|---:|
| Dr. Asha Rao | General Medicine | MBBS, MD | 8 years | ₹500 |
| Dr. Vikram Sen | Cardiology | MBBS, MD | 12 years | ₹900 |
| Dr. Meera Das | Dermatology | MBBS, MD | 6 years | ₹650 |
| Dr. Arjun Nair | Pediatrics | MBBS, DCH | 9 years | ₹600 |
| Dr. Kavya Iyer | Orthopedics | MBBS, MS | 10 years | ₹800 |

These are invented demo identities, not real providers. Add five or more specializations and multiple slots per doctor.

### Patients and appointment fixtures

- Seed ten fictional patient accounts with clearly fake emails such as `patient01@example.test`.
- Seed several future slots with `AVAILABLE` status and several with `UNAVAILABLE`.
- Include appointment examples in `PENDING`, `CONFIRMED`, `COMPLETED`, and `CANCELLED`; include `REJECTED` if using that status.
- Store only password hashes in the seed data. Provide documented demo credentials only for local development and never reuse them in production.
- Make seed scripts safe to rerun, or document that they reset the local demo database.

---

## 10. Validation rules

### Registration and profile

- Full name is required and length-limited.
- Email is required, normalized, and unique.
- Phone is optional unless the project chooses to require it; validate its format if supplied.
- Password must meet the documented password policy.
- Public registration always creates a `PATIENT`; never accept a role from public input.
- A doctor profile must have a valid specialization, non-negative fee, and non-negative experience.

### Availability

- Start time must be earlier than end time.
- Do not create slots in the past.
- Prevent exact duplicates and overlapping slots for the same doctor/date.
- Do not edit or deactivate a slot already booked unless the appointment is handled safely.
- Verify the slot belongs to the authenticated doctor or an authorized admin.

### Appointment booking and status

- The patient must be authenticated and active.
- Slot must exist, be available, be in the future, and belong to an active doctor.
- Visit reason must be present and length-limited.
- Doctor/date/time must be derived from the slot in the database.
- Only allowed status transitions may occur.
- Reject stale or duplicate booking attempts with a conflict response.
- Patient and doctor queries must be scoped to the authenticated user's own records.

---

## 11. Testing plan

The project document includes the following required checks. Add the concurrency and authorization tests below to make the implementation more reliable.

### Functional test checklist

- [ ] Patient registration and login work.
- [ ] Passwords are stored as hashes, not plaintext.
- [ ] Doctor and admin access is restricted to the correct roles.
- [ ] Doctor search and profile pages show correct fictional data.
- [ ] A patient can book an available slot.
- [ ] Two requests cannot book the same doctor/time slot.
- [ ] Doctors can update availability and appointment status.
- [ ] Patients can view their own appointments.
- [ ] Patients can cancel eligible bookings.
- [ ] Invalid forms show useful validation messages.
- [ ] The interface works on desktop, tablet, and mobile.
- [ ] Admin can manage doctors, users, specializations, and appointments.
- [ ] Dashboard counts match the seeded database.
- [ ] Loading, empty, error, and confirmation states are visible.

### Security and edge-case tests

- [ ] Patient A cannot view or cancel Patient B's appointment by changing an ID.
- [ ] A doctor cannot edit another doctor's availability or appointments.
- [ ] A patient cannot submit a request with `role: "ADMIN"` to gain privileges.
- [ ] Invalid IDs and malformed JSON return controlled errors.
- [ ] SQL injection-style input does not change query behavior.
- [ ] Cancelled/rejected bookings release their slot claim according to policy.
- [ ] Concurrent requests for one slot result in exactly one successful booking.
- [ ] Deactivated users/doctors cannot create new bookings.
- [ ] No secret or stack trace is exposed in an API error.

Document test outcomes in the project report: **Pass / Fail / Not tested**, plus a short note for failures.

---

## 12. Local development setup

These steps assume Node.js, npm, and MySQL are installed.

### 12.1 Create the project

```bash
mkdir doctor-appointment-booking-system
cd doctor-appointment-booking-system
mkdir frontend backend
```

### 12.2 Backend setup

```bash
cd backend
npm init -y
npm install express mysql2 dotenv cors helmet express-rate-limit
npm install --save-dev nodemon
```

Add authentication, validation, and testing packages chosen by the implementation (for example, a password-hashing library, a schema validator, and a test runner). Choose compatible versions and document them in `package.json`.

Create the database, run migration SQL, configure `backend/.env` based on `.env.example`, and implement `src/server.js` / `src/app.js`.

Example scripts to add to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "test": "node --test"
  }
}
```

The test script is illustrative; use the test runner actually installed in the project.

### 12.3 Frontend setup

From the project root:

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install react-router-dom
npm install -D tailwindcss
```

Tailwind setup commands can differ by Tailwind version; follow the setup guide for the installed version and record the version in the README.

Create `frontend/.env` with:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Only expose non-secret values prefixed for frontend use. **Never put database passwords, session secrets, or private API keys in frontend environment variables.**

### 12.4 Run locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Open the local URL printed by Vite. Verify the backend health endpoint (recommended: `GET /api/v1/health`), database connection, login, search, booking, and role-specific dashboards.

### 12.5 Suggested repository layout

```text
doctor-appointment-booking-system/
├── frontend/
├── backend/
├── database/
│   ├── migrations/
│   └── seeders/
├── docs/
│   ├── architecture.md
│   └── api.md
├── .gitignore
└── README.md
```

Keep migrations and seed scripts in one documented location; avoid duplicating them between `backend/` and `database/` without a clear convention.

---

## 13. Suggested implementation order

1. **Database first:** create tables, constraints, migrations, and fictional seed data.
2. **Backend foundation:** connect to MySQL, add health endpoint, central error handling, and request validation.
3. **Authentication:** register/login/logout, password hashing, session handling, and role/ownership middleware.
4. **Doctor directory:** doctor list, search/filter, profile, and specializations.
5. **Availability:** create/update slots and validate date/time conflicts.
6. **Booking core:** transaction-safe slot locking/claiming, pending appointments, cancellation, and status transitions.
7. **Patient frontend:** registration/login, directory, profile, booking form, appointment history.
8. **Doctor frontend:** dashboard, appointment decisions, availability management.
9. **Admin frontend:** counts, doctor/user/specialization management, appointment review.
10. **Quality pass:** responsive UI, accessibility, validation/loading/error states, security checks, concurrency tests, and project documentation.

---

## 14. Expected deliverables checklist

- [ ] Working React + Tailwind frontend.
- [ ] Working Node.js + Express backend.
- [ ] MySQL schema, migrations, and fictional seed data.
- [ ] Patient, Doctor, and Admin authentication and role-based dashboards.
- [ ] Doctor directory and profile.
- [ ] Availability management.
- [ ] Appointment booking, status updates, history, and eligible cancellation.
- [ ] Database-safe prevention of duplicate/overlapping active bookings.
- [ ] API endpoint documentation with example requests/responses.
- [ ] `.env.example` without real secrets.
- [ ] Local installation and run instructions.
- [ ] Testing checklist with actual results.
- [ ] Screenshots/diagrams for the SEMP report, using fictional demonstration data.

---

## 15. Final recommendation

For this college mini-project, use **React + Tailwind CSS** for a responsive role-based frontend, **Node.js + Express.js** for a REST API, and **MySQL/InnoDB** for relational persistence. Keep controllers thin, place appointment rules in a service layer, and let the database enforce relationships and booking uniqueness. The highest-risk feature is preventing two patients from booking the same slot; implement it with a transaction and database-enforced slot claim, then test concurrent booking requests.

The application should be considered complete only when its real navigation, forms, API calls, persistence, authorization, and booking rules work—not merely when the screens look finished.
