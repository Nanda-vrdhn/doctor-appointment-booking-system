/**
 * End-to-end API tests. These boot the real Express app against a throwaway
 * SQLite database, seed it with the fictional demo data, and drive the HTTP
 * API with fetch — including the concurrency and authorization edge cases from
 * the testing checklist.
 *
 * Run: npm test
 */
import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Point the app at a temporary database BEFORE importing it.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dat-api-test-'))
process.env.DB_PATH = path.join(tmpDir, 'test.db')
process.env.JWT_SECRET = 'test-only-secret'
process.env.NODE_ENV = 'test'

const { default: app } = await import('../src/app.js')
const { seed } = await import('../src/config/seed.js')
const { closeDatabase } = await import('../src/config/database.js')
seed()

/** Tiny cookie-aware HTTP client. */
function client() {
  const cookies = new Map()
  return {
    async request(method, urlPath, { body, token } = {}) {
      const headers = { 'content-type': 'application/json' }
      if (cookies.size) headers.cookie = [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
      if (token) headers.authorization = `Bearer ${token}`
      const res = await fetch(base + urlPath, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const setCookies = res.headers.getSetCookie
        ? res.headers.getSetCookie()
        : res.headers.get('set-cookie')
        ? [res.headers.get('set-cookie')]
        : []
      for (const sc of setCookies) {
        const [pair] = sc.split(';')
        const eq = pair.indexOf('=')
        cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
      }
      let json = null
      try {
        json = await res.json()
      } catch {
        /* empty body */
      }
      return { status: res.status, body: json }
    },
  }
}

let server
let base

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.on('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api/v1`
})

after(() => {
  server?.close()
  closeDatabase()
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

test('health endpoint reports seeded counts', async () => {
  const c = client()
  const res = await c.request('GET', '/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.data.status, 'ok')
  assert.ok(res.body.data.db.users >= 16)
})

test('public registration always creates a PATIENT, even if role=ADMIN is sent', async () => {
  const c = client()
  const res = await c.request('POST', '/auth/register', {
    body: { fullName: 'Test Patient', email: 'rolehacker@test.test', password: 'Passw0rd1', role: 'ADMIN' },
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.data.user.role, 'PATIENT')
})

test('login fails generically for a wrong password', async () => {
  const c = client()
  const res = await c.request('POST', '/auth/login', {
    body: { email: 'patient01@example.test', password: 'wrong-password' },
  })
  assert.equal(res.status, 401)
  assert.equal(res.body.error.code, 'INVALID_CREDENTIALS')
})

test('doctor directory is public and searchable', async () => {
  const c = client()
  const all = await c.request('GET', '/doctors')
  assert.equal(all.status, 200)
  assert.ok(all.body.data.doctors.length >= 5)

  const filtered = await c.request('GET', '/doctors?name=Asha')
  assert.ok(filtered.body.data.doctors.length >= 1)
  assert.match(filtered.body.data.doctors[0].full_name, /Asha/)
})

test('doctor profile and public availability are readable', async () => {
  const c = client()
  const list = await c.request('GET', '/doctors')
  const doctor = list.body.data.doctors[0]
  const profile = await c.request('GET', `/doctors/${doctor.doctor_id}`)
  assert.equal(profile.status, 200)
  assert.equal(profile.body.data.doctor.doctor_id, doctor.doctor_id)

  const slots = await c.request('GET', `/doctors/${doctor.doctor_id}/availability`)
  assert.equal(slots.status, 200)
  assert.ok(Array.isArray(slots.body.data.slots))
})

test('protected routes reject unauthenticated requests', async () => {
  const c = client()
  const res = await c.request('GET', '/users/me')
  assert.equal(res.status, 401)
})

test('a patient can book an available slot', async () => {
  const c = client()
  const login = await c.request('POST', '/auth/login', {
    body: { email: 'patient03@example.test', password: 'Patient@123' },
  })
  assert.equal(login.status, 200)

  const list = await c.request('GET', '/doctors')
  const doctor = list.body.data.doctors.find((d) => d.bookable_slots > 0)
  const slots = await c.request('GET', `/doctors/${doctor.doctor_id}/availability`)
  const slot = slots.body.data.slots[0]

  const booked = await c.request('POST', '/appointments', {
    body: { availabilityId: slot.availability_id, reason: 'Follow-up consultation' },
  })
  assert.equal(booked.status, 201)
  assert.equal(booked.body.data.appointment.status, 'PENDING')

  const mine = await c.request('GET', '/appointments/mine')
  assert.equal(mine.status, 200)
  assert.ok(mine.body.data.appointments.some((a) => a.appointment_id === booked.body.data.appointment.appointment_id))
})

test('the same slot cannot be double-booked (duplicate attempt -> 409)', async () => {
  const c = client()
  await c.request('POST', '/auth/login', {
    body: { email: 'patient04@example.test', password: 'Patient@123' },
  })
  const list = await c.request('GET', '/doctors')
  const doctor = list.body.data.doctors.find((d) => d.bookable_slots > 0)
  const slots = await c.request('GET', `/doctors/${doctor.doctor_id}/availability`)
  const slot = slots.body.data.slots[0]

  const first = await c.request('POST', '/appointments', {
    body: { availabilityId: slot.availability_id, reason: 'First booking' },
  })
  assert.equal(first.status, 201)
  const second = await c.request('POST', '/appointments', {
    body: { availabilityId: slot.availability_id, reason: 'Duplicate booking' },
  })
  assert.equal(second.status, 409)
})

test('concurrent requests for one slot result in exactly one booking', async () => {
  // A fresh patient + a fresh slot, hit by 8 requests at once.
  const c = client()
  await c.request('POST', '/auth/register', {
    body: { fullName: 'Race Patient', email: 'race@test.test', password: 'Passw0rd1' },
  })
  const list = await c.request('GET', '/doctors')
  const doctor = list.body.data.doctors.find((d) => d.bookable_slots > 0)
  const slots = await c.request('GET', `/doctors/${doctor.doctor_id}/availability`)
  const slot = slots.body.data.slots[0]

  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      c.request('POST', '/appointments', {
        body: { availabilityId: slot.availability_id, reason: 'Race booking' },
      })
    )
  )
  const created = results.filter((r) => r.status === 201)
  const conflicts = results.filter((r) => r.status === 409)
  assert.equal(created.length, 1, 'exactly one booking must succeed')
  assert.equal(created.length + conflicts.length, 8)
})

test('a patient cannot cancel another patient appointment', async () => {
  const admin = client()
  await admin.request('POST', '/auth/login', {
    body: { email: 'admin@clinic.test', password: 'Admin@123' },
  })
  const all = await admin.request('GET', '/admin/appointments')
  const target = all.body.data.appointments.find((a) => a.patient_name !== 'Riya Sharma')
  assert.ok(target, 'expected a seeded appointment')

  const attacker = client()
  await attacker.request('POST', '/auth/login', {
    body: { email: 'patient01@example.test', password: 'Patient@123' },
  })
  const res = await attacker.request('PATCH', `/appointments/${target.appointment_id}/cancel`)
  assert.equal(res.status, 403)
})

test('a doctor can accept a pending appointment assigned to them', async () => {
  // Deterministically create a pending booking with Dr. Asha Rao.
  const patient = client()
  await patient.request('POST', '/auth/register', {
    body: { fullName: 'Accept Tester', email: 'accept@test.test', password: 'Passw0rd1' },
  })
  const docs = await patient.request('GET', '/doctors')
  const asha = docs.body.data.doctors.find((d) => d.full_name.includes('Asha'))
  const slots = await patient.request('GET', `/doctors/${asha.doctor_id}/availability`)
  const slot = slots.body.data.slots[0]
  const booked = await patient.request('POST', '/appointments', {
    body: { availabilityId: slot.availability_id, reason: 'Please accept this' },
  })
  assert.equal(booked.status, 201)

  const doctor = client()
  const login = await doctor.request('POST', '/auth/login', {
    body: { email: 'asha.rao@clinic.test', password: 'Doctor@123' },
  })
  assert.equal(login.status, 200)
  assert.equal(login.body.data.user.role, 'DOCTOR')

  const accepted = await doctor.request(
    'PATCH',
    `/appointments/doctor/appointments/${booked.body.data.appointment.appointment_id}/status`,
    { body: { action: 'accept' } }
  )
  assert.equal(accepted.status, 200)
  assert.equal(accepted.body.data.appointment.status, 'CONFIRMED')
})

test('a doctor cannot act on an appointment that is not theirs', async () => {
  const doctor = client()
  await doctor.request('POST', '/auth/login', {
    body: { email: 'meera.das@clinic.test', password: 'Doctor@123' },
  })
  const admin = client()
  await admin.request('POST', '/auth/login', {
    body: { email: 'admin@clinic.test', password: 'Admin@123' },
  })
  const all = await admin.request('GET', '/admin/appointments')
  const appt = all.body.data.appointments.find((a) => a.doctor_name !== 'Dr. Meera Das')
  const res = await doctor.request('PATCH', `/appointments/doctor/appointments/${appt.appointment_id}/status`, {
    body: { action: 'accept' },
  })
  assert.equal(res.status, 404)
})

test('invalid input returns a controlled 422 validation error', async () => {
  const c = client()
  const res = await c.request('POST', '/auth/register', {
    body: { fullName: 'X', email: 'not-an-email', password: 'short' },
  })
  assert.equal(res.status, 422)
  assert.equal(res.body.error.code, 'VALIDATION_ERROR')
  assert.ok(res.body.error.details)
})

test('admin dashboard returns counts that match the seeded data', async () => {
  const admin = client()
  const login = await admin.request('POST', '/auth/login', {
    body: { email: 'admin@clinic.test', password: 'Admin@123' },
  })
  const res = await admin.request('GET', '/admin/dashboard')
  assert.equal(res.status, 200)
  assert.ok(res.body.data.users.PATIENT >= 10)
  assert.ok(res.body.data.users.DOCTOR >= 5)
  assert.ok(res.body.data.doctors.total >= 5)
  assert.ok(res.body.data.appointments.total >= 10)
})

test('a non-admin cannot reach the admin dashboard', async () => {
  const patient = client()
  await patient.request('POST', '/auth/login', {
    body: { email: 'patient05@example.test', password: 'Patient@123' },
  })
  const res = await patient.request('GET', '/admin/dashboard')
  assert.equal(res.status, 403)
})

test('a patient can cancel their own future appointment and the slot is released', async () => {
  const patient = client()
  await patient.request('POST', '/auth/register', {
    body: { fullName: 'Cancel Tester', email: 'cancel@test.test', password: 'Passw0rd1' },
  })
  const docs = await patient.request('GET', '/doctors')
  const doctor = docs.body.data.doctors.find((d) => d.bookable_slots > 0)
  const slots = await patient.request('GET', `/doctors/${doctor.doctor_id}/availability`)
  const slot = slots.body.data.slots[0]

  const booked = await patient.request('POST', '/appointments', {
    body: { availabilityId: slot.availability_id, reason: 'I will cancel this' },
  })
  assert.equal(booked.status, 201)

  const cancel = await patient.request('PATCH', `/appointments/${booked.body.data.appointment.appointment_id}/cancel`)
  assert.equal(cancel.status, 200)
  assert.equal(cancel.body.data.appointment.status, 'CANCELLED')

  // The released slot should be bookable again.
  const after = await client().request('GET', `/doctors/${doctor.doctor_id}/availability`)
  assert.ok(after.body.data.slots.some((s) => s.availability_id === slot.availability_id))
})
