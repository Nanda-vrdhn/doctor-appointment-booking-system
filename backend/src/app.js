import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { env } from './config/env.js'
import { initSchema, tableCounts } from './config/database.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/users.routes.js'
import doctorRoutes from './routes/doctors.routes.js'
import specializationRoutes from './routes/specializations.routes.js'
import availabilityRoutes from './routes/availability.routes.js'
import doctorProfileRoutes from './routes/doctor.routes.js'
import appointmentRoutes from './routes/appointments.routes.js'
import adminRoutes from './routes/admin.routes.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

// Throttle authentication attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again later.' } },
})
app.use('/api/v1/auth', authLimiter)

// Ensure the schema exists, then expose a health check.
initSchema()
app.get('/api/v1/health', (req, res) => {
  res.json({
    data: { status: 'ok', time: new Date().toISOString(), db: tableCounts() },
  })
})

// --- routes ---------------------------------------------------------------
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/doctors', doctorRoutes)
app.use('/api/v1/specializations', specializationRoutes)
app.use('/api/v1/doctor', doctorProfileRoutes)
app.use('/api/v1/doctor/availability', availabilityRoutes)
app.use('/api/v1/appointments', appointmentRoutes)
app.use('/api/v1/admin', adminRoutes)

// --- production: serve the built React app from the same origin ------------
// Serving the SPA from this server keeps the httpOnly session cookie on one
// origin (SameSite=Lax), so no CORS or cookie changes are needed on deploy.
// When frontend/dist is missing — the normal dev setup — this block is skipped
// and the Vite dev server proxies /api here instead.
const here = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(here, '..', '..', 'frontend', 'dist')
const indexHtml = path.join(distDir, 'index.html')

if (fs.existsSync(indexHtml)) {
  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        // Vite fingerprints /assets/*, so those are safe to cache forever.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    })
  )

  // Deep links such as /login/doctor or /admin/users must return the SPA shell.
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(indexHtml)
  })
}

app.use(notFound)
app.use(errorHandler)

export default app
