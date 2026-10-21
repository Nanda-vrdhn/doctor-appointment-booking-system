/**
 * Fictional demonstration data. Run with:
 *     npm run seed          # seeds only if the database is empty
 *     npm run seed:reset    # wipes and re-seeds the local demo database
 *
 * Every record below is invented. No real patient or doctor information is
 * used. Passwords are stored only as bcrypt hashes.
 */
import bcrypt from 'bcryptjs'
import { getDb, initSchema, transaction, DB_PATH } from './database.js'

const SPECIALIZATIONS = [
  ['General Medicine', 'Primary care and treatment of common illnesses.'],
  ['Cardiology', 'Heart and blood-vessel conditions.'],
  ['Dermatology', 'Skin, hair and nail conditions.'],
  ['Pediatrics', 'Health care for infants, children and adolescents.'],
  ['Orthopedics', 'Bones, joints, ligaments and muscles.'],
  ['Neurology', 'Brain, spinal cord and nerve disorders.'],
  ['Gynecology', "Women's reproductive health."],
]

const DOCTORS = [
  { email: 'asha.rao@clinic.test', name: 'Dr. Asha Rao', spec: 'General Medicine', qualification: 'MBBS, MD', experience: 8, fee: 500, description: 'General physician focused on preventive care and chronic disease management.' },
  { email: 'vikram.sen@clinic.test', name: 'Dr. Vikram Sen', spec: 'Cardiology', qualification: 'MBBS, MD', experience: 12, fee: 900, description: 'Cardiologist treating hypertension, heart failure and arrhythmia.' },
  { email: 'meera.das@clinic.test', name: 'Dr. Meera Das', spec: 'Dermatology', qualification: 'MBBS, MD', experience: 6, fee: 650, description: 'Dermatologist for acne, eczema, pigmentation and skin infections.' },
  { email: 'arjun.nair@clinic.test', name: 'Dr. Arjun Nair', spec: 'Pediatrics', qualification: 'MBBS, DCH', experience: 9, fee: 600, description: 'Paediatrician for newborn care, vaccination and childhood illness.' },
  { email: 'kavya.iyer@clinic.test', name: 'Dr. Kavya Iyer', spec: 'Orthopedics', qualification: 'MBBS, MS', experience: 10, fee: 800, description: 'Orthopaedic surgeon for fractures, joint pain and sports injuries.' },
]

const PATIENTS = [
  ['Riya Sharma', 'patient01@example.test'],
  ['Arjun Mehta', 'patient02@example.test'],
  ['Sneha Kulkarni', 'patient03@example.test'],
  ['Rahul Verma', 'patient04@example.test'],
  ['Priya Nair', 'patient05@example.test'],
  ['Karan Malhotra', 'patient06@example.test'],
  ['Divya Pillai', 'patient07@example.test'],
  ['Aditya Joshi', 'patient08@example.test'],
  ['Neha Gupta', 'patient09@example.test'],
  ['Suresh Reddy', 'patient10@example.test'],
]

const PASSWORDS = { PATIENT: 'Patient@123', DOCTOR: 'Doctor@123', ADMIN: 'Admin@123' }

// 30-minute bookable slots at fixed clinic hours.
const SLOT_STARTS = ['09:00:00', '11:00:00', '15:00:00']
const SLOT_MINUTES = 30

const DAYS_BACK = 7
const DAYS_FORWARD = 14

function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

function hash(password) {
  return bcrypt.hashSync(password, 10)
}

export function seed({ reset = false } = {}) {
  const db = getDb()
  initSchema()

  const existing = db.prepare('SELECT COUNT(*) AS c FROM users').get().c

  if (existing > 0 && !reset) {
    console.log(`Database already has ${existing} users. Use --reset to wipe and re-seed.`)
    return
  }

  transaction((tx) => {
    if (reset) {
      // Release slot claims first (availability -> appointments is a circular FK).
      tx.exec('UPDATE availability SET booked_appointment_id = NULL;')
      tx.exec('DELETE FROM appointments;')
      tx.exec('DELETE FROM availability;')
      tx.exec('DELETE FROM doctors;')
      tx.exec('DELETE FROM specializations;')
      tx.exec('DELETE FROM users;')
      tx.exec('DELETE FROM sqlite_sequence;')
    }

    const hashPatient = hash(PASSWORDS.PATIENT)
    const hashDoctor = hash(PASSWORDS.DOCTOR)
    const hashAdmin = hash(PASSWORDS.ADMIN)

    // --- specializations -------------------------------------------------
    const insSpec = tx.prepare(
      'INSERT INTO specializations (name, description) VALUES (?, ?)'
    )
    const specIds = {}
    for (const [name, description] of SPECIALIZATIONS) {
      const info = insSpec.run(name, description)
      specIds[name] = Number(info.lastInsertRowid)
    }

    // --- users ----------------------------------------------------------
    const insUser = tx.prepare(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, ?)`
    )
    const userIds = {}
    const nextPhone = (i) => `+91-98${String(10000000 + i * 137).slice(0, 8)}`

    DOCTORS.forEach((doc, i) => {
      const info = insUser.run(doc.name, doc.email, hashDoctor, nextPhone(i), 'DOCTOR')
      userIds[doc.email] = Number(info.lastInsertRowid)
    })

    PATIENTS.forEach(([name, email], i) => {
      const info = insUser.run(name, email, hashPatient, nextPhone(i + 20), 'PATIENT')
      userIds[email] = Number(info.lastInsertRowid)
    })

    const adminId = Number(
      insUser.run('Clinic Administrator', 'admin@clinic.test', hashAdmin, '+91-9000000000', 'ADMIN')
        .lastInsertRowid
    )

    // --- doctors --------------------------------------------------------
    const insDoctor = tx.prepare(
      `INSERT INTO doctors
         (user_id, specialization_id, qualification, experience_years, consultation_fee, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    const doctorIds = {}
    DOCTORS.forEach((doc) => {
      const info = insDoctor.run(
        userIds[doc.email],
        specIds[doc.spec],
        doc.qualification,
        doc.experience,
        doc.fee,
        doc.description
      )
      doctorIds[doc.email] = Number(info.lastInsertRowid)
    })

    // --- availability ----------------------------------------------------
    const insSlot = tx.prepare(
      `INSERT INTO availability
         (doctor_id, available_date, start_time, end_time, slot_status)
       VALUES (?, ?, ?, ?, ?)`
    )
    const slots = [] // { doctorId, availabilityId, date, time }
    let dayIndex = 0
    for (let offset = -DAYS_BACK; offset <= DAYS_FORWARD; offset++) {
      const date = fmtDate(addDays(offset))
      DOCTORS.forEach((doc) => {
        const doctorId = doctorIds[doc.email]
        SLOT_STARTS.forEach((start, s) => {
          const [h, m] = start.split(':').map(Number)
          const end = new Date(2000, 0, 1, h, m + SLOT_MINUTES)
          const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(
            end.getMinutes()
          ).padStart(2, '0')}:00`
          // Roughly every fourth day, mark the middle slot unavailable.
          const status = dayIndex % 4 === 0 && s === 1 ? 'UNAVAILABLE' : 'AVAILABLE'
          const info = insSlot.run(doctorId, date, start, endTime, status)
          slots.push({
            doctorId,
            availabilityId: Number(info.lastInsertRowid),
            date,
            time: start,
            status,
          })
        })
      })
      dayIndex += 1
    }

    // --- appointments ---------------------------------------------------
    const insAppt = tx.prepare(
      `INSERT INTO appointments
         (patient_id, doctor_id, availability_id, appointment_date, appointment_time, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    const claim = tx.prepare(
      'UPDATE availability SET booked_appointment_id = ? WHERE availability_id = ?'
    )

    const today = fmtDate(new Date())
    // Active (pending/confirmed) bookings must sit on genuinely future slots;
    // completed bookings sit on past slots.
    const isFuture = (s) => new Date(`${s.date}T${s.time}`).getTime() > Date.now()
    const past = slots.filter((s) => s.date < today && s.status === 'AVAILABLE')
    const future = slots.filter((s) => s.status === 'AVAILABLE' && isFuture(s))

    // patient email -> booking plan: [status, reason]
    const plan = [
      ['COMPLETED', 'Routine health check-up'],
      ['COMPLETED', 'Follow-up for fever and cough'],
      ['COMPLETED', 'Skin rash consultation'],
      ['CONFIRMED', 'Chest pain evaluation'],
      ['CONFIRMED', 'Annual heart check-up'],
      ['PENDING', 'Stomach pain and acidity'],
      ['REJECTED', 'Requested late evening slot'],
      ['CANCELLED', 'Could not attend due to travel'],
      ['PENDING', 'Child vaccination follow-up'],
      ['PENDING', 'Knee pain while climbing stairs'],
    ]

    const patientEmails = PATIENTS.map(([, email]) => email)
    let pi = 0
    let pastIdx = 0
    let futureIdx = 0

    patientEmails.forEach((email, i) => {
      const [status, reason] = plan[i]
      const slot =
        status === 'COMPLETED'
          ? past[pastIdx++ % past.length]
          : future[futureIdx++ % future.length]

      const info = insAppt.run(
        userIds[email],
        slot.doctorId,
        slot.availabilityId,
        slot.date,
        slot.time,
        reason,
        status
      )
      const appointmentId = Number(info.lastInsertRowid)

      // Only active (PENDING/CONFIRMED) bookings hold the slot claim.
      if (status === 'PENDING' || status === 'CONFIRMED' || status === 'COMPLETED') {
        claim.run(appointmentId, slot.availabilityId)
      }
      pi += 1
    })

    return { pi, adminId }
  })

  const counts = {
    specializations: SPECIALIZATIONS.length,
    doctors: DOCTORS.length,
    patients: PATIENTS.length,
    admins: 1,
  }
  console.log(`Seeded ${DB_PATH}`)
  console.log(
    `  ${counts.specializations} specializations, ${counts.doctors} doctors, ` +
      `${counts.patients} patients, ${counts.admins} admin`
  )
  console.log('  Demo logins: patient01@example.test / Patient@123, admin@clinic.test / Admin@123')
}

// Only run as a script when invoked directly (npm run seed), not when imported
// by the server for auto-seeding on first run.
const invokedDirectly =
  process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('/src/config/seed.js')

if (invokedDirectly) {
  try {
    seed({ reset: process.argv.includes('--reset') })
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  }
}
