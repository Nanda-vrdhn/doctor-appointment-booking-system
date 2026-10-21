import { useCallback, useEffect, useState } from 'react'
import * as adminService from '../../services/adminService.js'
import AppointmentTable from '../../components/appointments/AppointmentTable.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'

const TABS = ['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED']

export default function AdminAppointments() {
  const [status, setStatus] = useState('')
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    adminService
      .listAppointments({ status })
      .then((d) => setAppointments(d.appointments))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [status])

  useEffect(load, [load])

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
      <p className="mt-1 text-sm text-slate-500">Review every appointment in the system.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setStatus(t)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              status === t
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {t || 'All'}
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
          <AppointmentTable appointments={appointments} variant="admin" />
        )}
      </div>
    </div>
  )
}
