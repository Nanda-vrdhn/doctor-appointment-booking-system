import StatusBadge from '../common/StatusBadge.jsx'
import { formatDate, formatTime } from '../../utils/dateTime.js'

/**
 * Readable appointment table. `columns` controls which context columns show
 * (patient vs doctor view).
 */
export default function AppointmentTable({ appointments, variant = 'patient', onCancel, onAction }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Time</th>
            {variant === 'admin' ? (
              <>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
              </>
            ) : (
              <th className="px-4 py-3">{variant === 'doctor' ? 'Patient' : 'Doctor'}</th>
            )}
            <th className="px-4 py-3">Specialization</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {appointments.map((a) => (
            <tr key={a.appointment_id} className="hover:bg-slate-50">
              <td className="whitespace-nowrap px-4 py-3">{formatDate(a.appointment_date)}</td>
              <td className="whitespace-nowrap px-4 py-3">{formatTime(a.appointment_time)}</td>
              {variant === 'admin' ? (
                <>
                  <td className="px-4 py-3">{a.patient_name}</td>
                  <td className="px-4 py-3">{a.doctor_name}</td>
                </>
              ) : (
                <td className="px-4 py-3">
                  {variant === 'doctor' ? a.patient_name : a.doctor_name}
                </td>
              )}
              <td className="px-4 py-3 text-slate-500">{a.specialization_name}</td>
              <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={a.reason}>
                {a.reason}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={a.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {onAction && ['PENDING', 'CONFIRMED'].includes(a.status) && (
                  <div className="flex justify-end gap-2">
                    {a.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onAction(a, 'accept')}
                          className="btn-primary px-2 py-1 text-xs"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction(a, 'reject')}
                          className="btn-danger px-2 py-1 text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {a.status === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => onAction(a, 'complete')}
                        className="btn-primary px-2 py-1 text-xs"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onAction(a, 'cancel')}
                      className="btn-danger px-2 py-1 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {onCancel && ['PENDING', 'CONFIRMED'].includes(a.status) && (
                  <button
                    type="button"
                    onClick={() => onCancel(a)}
                    className="btn-danger px-2 py-1 text-xs"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
