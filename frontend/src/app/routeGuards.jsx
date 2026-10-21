import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'

export function FullScreenLoader({ label = 'Loading your session…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner label={label} />
    </div>
  )
}

/** Requires an authenticated user (optionally of a specific role). */
export function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/login/patient" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) {
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />
  }
  return children
}

/** For login/register — sends already-logged-in users to their dashboard. */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} replace />
  return children
}
