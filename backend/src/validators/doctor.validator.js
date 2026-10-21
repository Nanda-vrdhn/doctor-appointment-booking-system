import { integer, optional, required } from './common.js'

/** Doctor updates their own professional profile. All fields optional. */
export function validateDoctorProfile(body) {
  const data = {
    specializationId:
      body.specializationId === undefined || body.specializationId === ''
        ? undefined
        : Number(body.specializationId),
    qualification:
      body.qualification === undefined ? undefined : String(body.qualification).trim(),
    experienceYears:
      body.experienceYears === undefined || body.experienceYears === ''
        ? undefined
        : Number(body.experienceYears),
    consultationFee:
      body.consultationFee === undefined || body.consultationFee === ''
        ? undefined
        : Number(body.consultationFee),
    description: body.description === undefined ? undefined : String(body.description).trim(),
  }
  const errors = {}
  if (data.qualification !== undefined) {
    const e = required(data.qualification, 'Qualification', { max: 200 })
    if (e) errors.qualification = e
  }
  if (data.experienceYears !== undefined) {
    const e = integer(data.experienceYears, 'Experience', { min: 0, max: 80 })
    if (e) errors.experienceYears = e
  }
  if (data.consultationFee !== undefined) {
    const e = integer(data.consultationFee, 'Consultation fee', { min: 0 })
    if (e) errors.consultationFee = e
  }
  if (data.specializationId !== undefined && !Number.isInteger(data.specializationId)) {
    errors.specializationId = 'Specialization must be a valid id.'
  }
  if (data.description !== undefined) {
    const e = optional(data.description, 'Description', { max: 2000 })
    if (e) errors.description = e
  }
  return { data, errors }
}
