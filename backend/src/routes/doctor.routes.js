import { Router } from 'express'
import * as ctrl from '../controllers/doctorProfile.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { validateDoctorProfile } from '../validators/doctor.validator.js'

// Authenticated doctor profile endpoints (/api/v1/doctor/profile).
const router = Router()

router.use(authenticate, authorizeRole('DOCTOR'))

router.get('/profile', ctrl.get)
router.patch('/profile', validateRequest(validateDoctorProfile), ctrl.update)

export default router
