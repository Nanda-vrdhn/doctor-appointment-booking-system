/**
 * Central environment configuration. Everything is read once, validated, and
 * exported as a frozen object so the rest of the app cannot mutate it.
 *
 * Secrets live in backend/.env (git-ignored), never in source control.
 */
import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_DEV_SECRET = 'dev-only-insecure-secret-change-me'

function resolveDbPath(raw) {
  if (!raw) raw = 'data/appointments.db'
  // Allow both absolute paths and paths relative to the backend folder.
  // `here` is backend/src/config, so ../.. is the backend folder.
  return path.isAbsolute(raw) ? raw : path.resolve(here, '..', '..', raw)
}

const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  HOST: process.env.HOST || '127.0.0.1',
  CLIENT_ORIGIN: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').replace(/\/$/, ''),
  DB_PATH: resolveDbPath(process.env.DB_PATH),
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_DEV_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: process.env.COOKIE_NAME || 'dat_token',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
})

if (env.isProduction && env.JWT_SECRET === DEFAULT_DEV_SECRET) {
  throw new Error(
    'JWT_SECRET must be set to a strong unique value in production. Refusing to start.'
  )
}

export { env }
