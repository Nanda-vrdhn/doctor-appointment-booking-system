import { Link } from 'react-router-dom'

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function DoctorCard({ doctor }) {
  return (
    <Link
      to={`/doctors/${doctor.doctor_id}`}
      className="card block transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
          {initials(doctor.full_name)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-800">{doctor.full_name}</p>
          <p className="text-sm text-brand-600">{doctor.specialization_name}</p>
          <p className="text-xs text-slate-500">
            {doctor.qualification} · {doctor.experience_years} yrs exp
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">₹{doctor.consultation_fee}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-xs text-slate-500">{doctor.bookable_slots} slots available</span>
        <span className="font-medium text-brand-600">View profile →</span>
      </div>
    </Link>
  )
}
