import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as appointmentService from '../../services/appointmentService.js'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import StatCard from '../../components/common/StatCard.jsx'

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    appointmentService
      .doctorAppointments()
      .then((d) => setAppointments(d.appointments))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const pending = appointments.filter((a) => a.status === 'PENDING')
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMED')
  const completed = appointments.filter((a) => a.status === 'COMPLETED')

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Doctor dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Your appointment requests and schedule.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending requests" value={pending.length} />
        <StatCard label="Confirmed" value={confirmed.length} />
        <StatCard label="Completed" value={completed.length} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Pending requests</h2>
        <Link to="/doctor/availability" className="btn-secondary">
          Manage availability
        </Link>
      </div>

      <div className="mt-3">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-500">No pending requests right now.</p>
        ) : (
          <AppointmentTable appointments={pending} variant="doctor" />
        )}
      </div>
    </div>
  )
}
