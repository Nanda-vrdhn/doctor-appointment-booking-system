import { Router } from 'express'
import * as ctrl from '../controllers/availability.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { validateRequest } from '../middleware/validateRequest.js'
import {
  validateCreateSlot,
  validateUpdateSlot,
} from '../validators/availability.validator.js'

const router = Router()

router.use(authenticate, authorizeRole('DOCTOR'))

router.get('/', ctrl.list)
router.post('/', validateRequest(validateCreateSlot), ctrl.create)
router.patch('/:id', validateRequest(validateUpdateSlot), ctrl.update)
router.patch('/:id/deactivate', ctrl.deactivate)

export default router
