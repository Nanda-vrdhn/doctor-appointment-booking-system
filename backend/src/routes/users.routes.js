import { Router } from 'express'
import * as ctrl from '../controllers/user.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { validateUpdateProfile } from '../validators/user.validator.js'

const router = Router()

router.get('/me', authenticate, ctrl.getProfile)
router.patch('/me', authenticate, validateRequest(validateUpdateProfile), ctrl.updateProfile)

export default router
