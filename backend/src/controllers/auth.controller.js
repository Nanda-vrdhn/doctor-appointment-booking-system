import { asyncHandler } from '../utils/asyncHandler.js'
import { created, ok } from '../utils/http.js'
import { env } from '../config/env.js'
import { cookieOptions, signToken } from '../utils/jwt.js'
import * as authService from '../services/auth.service.js'

function setSession(res, user) {
  const token = signToken(user)
  res.cookie(env.COOKIE_NAME, token, cookieOptions())
}

export const register = asyncHandler(async (req, res) => {
  const user = authService.register(req.validated)
  setSession(res, user)
  created(res, { user })
})

export const login = asyncHandler(async (req, res) => {
  const user = authService.login(req.validated)
  setSession(res, user)
  ok(res, { user })
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.COOKIE_NAME, { path: '/' })
  ok(res, { message: 'Logged out.' })
})

export const me = asyncHandler(async (req, res) => {
  ok(res, { user: authService.getMe(req.user.id) })
})
