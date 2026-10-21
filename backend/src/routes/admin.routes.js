import { Router } from 'express'
import * as ctrl from '../controllers/admin.controller.js'
import { adminList as adminAppointments } from '../controllers/appointment.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  validateCreateDoctor,
  validateSpecialization,
  validateStatusToggle,
  validateUpdateDoctor,
} from '../validators/admin.validator.js'

const router = Router()

router.use(authenticate, authorizeRole('ADMIN'))

router.get('/dashboard', ctrl.dashboard)
router.get('/appointments', adminAppointments)
router.get('/users', ctrl.listUsers)
router.patch(
  '/users/:id/status',
  validateRequest(validateStatusToggle),
  ctrl.setUserActive
)

router.post('/doctors', validateRequest(validateCreateDoctor), ctrl.createDoctor)
router.patch('/doctors/:id', validateRequest(validateUpdateDoctor), ctrl.updateDoctor)
router.patch(
  '/doctors/:id/status',
  validateRequest(validateStatusToggle),
  ctrl.setDoctorActive
)

router.get('/specializations', ctrl.listSpecializations)
router.post('/specializations', validateRequest(validateSpecialization), ctrl.createSpecialization)
router.patch(
  '/specializations/:id',
  validateRequest(validateSpecialization),
  ctrl.updateSpecialization
)
router.patch(
  '/specializations/:id/status',
  validateRequest(validateStatusToggle),
  ctrl.setSpecializationActive
)

export default router
