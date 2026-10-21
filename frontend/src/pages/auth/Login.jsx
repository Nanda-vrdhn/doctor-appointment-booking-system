import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import FormField from '../../components/common/FormField.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

/**
 * Each role has its own isolated login page. All three post to the same
 * POST /auth/login endpoint; the role shown here is only a visual hint. The
 * real role always comes back from the server and decides where you land, so
 * it cannot be spoofed by visiting a different portal page.
 */
const ROLES = {
  PATIENT: {
    label: 'Patient',
    title: 'Patient login',
    subtitle: 'Search doctors, book appointments and manage your visits.',
    cta: 'Log in as patient',
    buttonClass: 'btn-primary w-full',
    bannerClass: 'bg-brand-700',
    allowSignup: true,
  },
  DOCTOR: {
    label: 'Doctor',
    title: 'Doctor login',
    subtitle: 'Publish availability and accept, reject or complete appointments.',
    cta: 'Log in as doctor',
    buttonClass: 'btn w-full bg-emerald-600 text-white hover:bg-emerald-700',
    bannerClass: 'bg-emerald-700',
    allowSignup: false,
    note: 'Doctors cannot self-register — the clinic administrator issues these accounts.',
  },
  ADMIN: {
    label: 'Administrator',
    title: 'Administrator login',
    subtitle: 'Manage doctors, users, specializations and every appointment.',
    cta: 'Log in as administrator',
    buttonClass: 'btn w-full bg-slate-800 text-white hover:bg-slate-900',
    bannerClass: 'bg-slate-800',
    allowSignup: false,
    note: 'Administrator accounts are issued by the clinic.',
  },
}

export default function Login({ role = 'PATIENT' }) {
  const cfg = ROLES[role] || ROLES.PATIENT
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const user = await login(email.trim().toLowerCase(), password)
      const dest = location.state?.from || `/${user.role.toLowerCase()}/dashboard`
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className={`rounded-xl px-5 py-4 text-white ${cfg.bannerClass}`}>
        <p className="text-xs uppercase tracking-wide opacity-80">{cfg.label} portal</p>
        <h1 className="mt-1 text-xl font-bold">{cfg.title}</h1>
        <p className="mt-1 text-sm opacity-90">{cfg.subtitle}</p>
      </div>

      <form onSubmit={onSubmit} className="card mt-5 space-y-4" noValidate>
        {error && <ErrorMessage message={error} />}
        <FormField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormField>
        <button type="submit" className={cfg.buttonClass} disabled={busy}>
          {busy ? 'Logging in…' : cfg.cta}
        </button>
      </form>

      <div className="mt-5 text-center text-sm text-slate-500">
        {cfg.allowSignup ? (
          <p>
            New patient?{' '}
            <Link to="/register" className="font-medium text-brand-600">
              Create an account
            </Link>
          </p>
        ) : (
          <p className="text-xs">{cfg.note}</p>
        )}
      </div>
    </div>
  )
}
