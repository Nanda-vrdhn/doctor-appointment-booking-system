import { email, integer, password, phone, required } from './common.js'

const num = (value) =>
  value === undefined || value === null || value === '' ? null : Number(value)

export function validateCreateDoctor(body) {
  const data = {
    fullName: String(body.fullName ?? '').trim(),
    email: String(body.email ?? '').trim().toLowerCase(),
    password: String(body.password ?? ''),
    phone: String(body.phone ?? '').trim(),
    specializationId: num(body.specializationId),
    qualification: String(body.qualification ?? '').trim(),
    experienceYears: num(body.experienceYears) ?? 0,
    consultationFee: num(body.consultationFee) ?? 0,
    description: String(body.description ?? '').trim(),
  }
  const errors = {
    fullName: required(body.fullName, 'Full name', { min: 2, max: 120 }),
    email: email(body.email),
    password: password(body.password),
    phone: phone(body.phone),
    specializationId: integer(body.specializationId, 'Specialization', { min: 1 }),
    qualification: required(body.qualification, 'Qualification', { max: 200 }),
    experienceYears: integer(body.experienceYears, 'Experience', { min: 0, max: 80 }),
    consultationFee: integer(body.consultationFee, 'Consultation fee', { min: 0 }),
  }
  return { data, errors }
}

export function validateUpdateDoctor(body) {
  const data = {
    specializationId: body.specializationId === undefined ? undefined : num(body.specializationId),
    qualification:
      body.qualification === undefined ? undefined : String(body.qualification ?? '').trim(),
    experienceYears:
      body.experienceYears === undefined ? undefined : num(body.experienceYears),
    consultationFee:
      body.consultationFee === undefined ? undefined : num(body.consultationFee),
    description: body.description === undefined ? undefined : String(body.description ?? '').trim(),
  }
  const errors = {}
  if (data.experienceYears != null && (data.experienceYears < 0 || data.experienceYears > 80)) {
    errors.experienceYears = 'Experience must be between 0 and 80.'
  }
  if (data.consultationFee != null && data.consultationFee < 0) {
    errors.consultationFee = 'Consultation fee must be 0 or more.'
  }
  if (data.qualification != null && data.qualification.length > 200) {
    errors.qualification = 'Qualification must be 200 characters or fewer.'
  }
  if (data.specializationId != null && !Number.isInteger(data.specializationId)) {
    errors.specializationId = 'Specialization must be a valid id.'
  }
  return { data, errors }
}

export function validateSpecialization(body) {
  const data = {
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? '').trim(),
  }
  const errors = {
    name: required(body.name, 'Name', { min: 2, max: 100 }),
    description: required(body.description, 'Description', { max: 500 }),
  }
  return { data, errors }
}

export function validateStatusToggle(body) {
  const data = { isActive: Boolean(body.isActive) }
  return { data, errors: {} }
}
