import app from './app.js'
import { env } from './config/env.js'
import { initSchema, tableCounts } from './config/database.js'
import { seed } from './config/seed.js'

// Create tables if needed, and load fictional demo data on first run.
initSchema()
if (tableCounts().users === 0) {
  console.log('Empty database detected — loading fictional demonstration data...')
  seed()
}

const server = app.listen(env.PORT, env.HOST, () => {
  console.log('\n🩺  Doctor Appointment Booking System — API')
  console.log(`   Server : http://${env.HOST}:${env.PORT}`)
  console.log(`   Health : http://${env.HOST}:${env.PORT}/api/v1/health`)
  console.log('   Demo   : patient01@example.test / Patient@123')
  console.log('            asha.rao@clinic.test  / Doctor@123')
  console.log('            admin@clinic.test     / Admin@123\n')
})

function shutdown() {
  console.log('\nShutting down...')
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
