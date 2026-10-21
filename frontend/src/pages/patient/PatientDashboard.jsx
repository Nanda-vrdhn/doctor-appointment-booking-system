import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as appointmentService from '../../services/appointmentService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import StatCard from '../../components/common/StatCard.jsx'

export default function PatientDashboard() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    appointmentService
      .myAppointments()
      .then((d) => setAppointments(d.appointments))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const upcoming = appointments.filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status))
  const completed = appointments.filter((a) => a.status === 'COMPLETED')

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.fullName?.split(' ')[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">Here is a summary of your appointments.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming" value={upcoming.length} />
        <StatCard label="Completed" value={completed.length} />
        <StatCard label="Total" value={appointments.length} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Next appointments</h2>
        <Link to="/doctors" className="btn-primary">
          Book a new appointment
        </Link>
      </div>

      <div className="mt-3">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">You have no upcoming appointments.</p>
        ) : (
          <AppointmentTable appointments={upcoming} variant="patient" />
        )}
      </div>
    </div>
  )
}
