import { asyncHandler } from '../utils/asyncHandler.js'
import { ok } from '../utils/http.js'
import * as doctorService from '../services/doctor.service.js'

export const get = asyncHandler(async (req, res) => {
  const doctor = doctorService.getDoctorByUserId(req.user.id)
  if (!doctor) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } })
  ok(res, { doctor })
})

export const update = asyncHandler(async (req, res) => {
  const doctor = doctorService.updateDoctorProfile(req.user.id, req.validated)
  ok(res, { doctor })
})
