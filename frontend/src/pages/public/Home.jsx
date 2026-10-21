import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as doctorService from '../../services/doctorService.js'
import DoctorCard from '../../components/doctors/DoctorCard.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function Home() {
  const [name, setName] = useState('')
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    doctorService
      .listDoctors()
      .then((d) => setFeatured(d.doctors.slice(0, 3)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const onSearch = (e) => {
    e.preventDefault()
    const query = name.trim()
    navigate(query ? `/doctors?name=${encodeURIComponent(query)}` : '/doctors')
  }

  return (
    <div>
      <section className="bg-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h1 className="text-3xl font-bold md:text-4xl">
            Find a doctor and book an appointment
          </h1>
          <form onSubmit={onSearch} className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="home-search" className="sr-only">
              Search doctors
            </label>
            <input
              id="home-search"
              className="input flex-1"
              placeholder="Search by doctor name or specialization…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit" className="btn bg-white text-brand-700 hover:bg-brand-50">
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Featured doctors</h2>
          <Link to="/doctors" className="text-sm font-medium text-brand-600">
            View all →
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((d) => (
              <DoctorCard key={d.doctor_id} doctor={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
