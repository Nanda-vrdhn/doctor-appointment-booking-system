import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import FormField from '../../components/common/FormField.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({
        fullName: form.fullName,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone,
      })
      navigate('/patient/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-800">Create a patient account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Registration always creates a patient account.
      </p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-4" noValidate>
        {error && <ErrorMessage message={error} />}
        <FormField label="Full name" htmlFor="fullName">
          <input
            id="fullName"
            className="input"
            autoComplete="name"
            value={form.fullName}
            onChange={update('fullName')}
            required
          />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            required
          />
        </FormField>
        <FormField label="Phone (optional)" htmlFor="phone">
          <input
            id="phone"
            className="input"
            autoComplete="tel"
            value={form.phone}
            onChange={update('phone')}
          />
        </FormField>
        <FormField label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            required
          />
        </FormField>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login/patient" className="font-medium text-brand-600">
          Log in
        </Link>
      </p>
    </div>
  )
}
