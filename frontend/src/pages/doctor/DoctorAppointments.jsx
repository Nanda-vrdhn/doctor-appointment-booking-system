import { useEffect, useState } from 'react'
import * as appointmentService from '../../services/appointmentService.js'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

const TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REJECTED', label: 'Rejected' },
]

export default function DoctorAppointments() {
  const [status, setStatus] = useState('')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    setError('')
    appointmentService
      .doctorAppointments(status)
      .then((d) => setAppointments(d.appointments))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [status])

  const onAction = async (appointment, action) => {
    setBusyId(appointment.appointment_id)
    setError('')
    try {
      await appointmentService.updateAppointmentStatus(appointment.appointment_id, action)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
      <p className="mt-1 text-sm text-slate-500">
        Accept, reject, complete or cancel the appointments assigned to you.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              status === t.value
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : appointments.length === 0 ? (
          <EmptyState title="No appointments" description="Nothing matches this filter." />
        ) : (
          <AppointmentTable
            appointments={appointments}
            variant="doctor"
            onAction={onAction}
          />
        )}
      </div>
    </div>
  )
}
