import { Router } from 'express'
import * as ctrl from '../controllers/appointment.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { validateBook, validateStatus } from '../validators/appointment.validator.js'

const router = Router()

router.use(authenticate)

// --- patient --------------------------------------------------------------
router.post('/', authorizeRole('PATIENT'), validateRequest(validateBook), ctrl.book)
router.get('/mine', authorizeRole('PATIENT'), ctrl.mine)
router.patch('/:id/cancel', authorizeRole('PATIENT', 'ADMIN'), ctrl.cancel)

// --- doctor ---------------------------------------------------------------
router.get('/doctor/appointments', authorizeRole('DOCTOR'), ctrl.doctorList)
router.get('/doctor/appointments/:id', authorizeRole('DOCTOR'), ctrl.doctorGet)
router.patch(
  '/doctor/appointments/:id/status',
  authorizeRole('DOCTOR'),
  validateRequest(validateStatus),
  ctrl.doctorStatus
)

// Admin appointment review lives under /api/v1/admin (see admin.routes.js).

export default router
