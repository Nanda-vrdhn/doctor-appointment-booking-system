import { useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import StatCard from '../../components/common/StatCard.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService.dashboard().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorMessage message={error} />
  if (!data) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Admin dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview of users, doctors and appointments.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Patients" value={data.users.PATIENT} />
        <StatCard label="Doctors" value={data.doctors.active} hint={`${data.doctors.total} total`} />
        <StatCard label="Appointments" value={data.appointments.total} />
        <StatCard label="Specializations" value={data.specializations.active} />
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold text-slate-800">Appointment status breakdown</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data.appointments.byStatus).map(([status, count]) => (
            <span key={status} className="badge bg-slate-100 text-slate-700">
              {status}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="font-semibold text-slate-800">Slot status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data.slots).map(([status, count]) => (
            <span key={status} className="badge bg-slate-100 text-slate-700">
              {status}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
