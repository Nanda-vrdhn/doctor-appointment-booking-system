import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const linkClass = ({ isActive }) =>
  `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-brand-600'}`

const PORTALS = [
  { label: 'Patient', to: '/login/patient' },
  { label: 'Doctor', to: '/login/doctor' },
  { label: 'Administrator', to: '/login/admin' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the portal dropdown on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/healthcare-logo.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-semibold text-brand-800">CareConnect</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/doctors" className={linkClass}>
            Find Doctors
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            Contact
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to={`/${user.role.toLowerCase()}/dashboard`} className="btn-secondary">
                Dashboard
              </Link>
              <button type="button" onClick={onLogout} className="btn-secondary">
                Log out
              </button>
            </>
          ) : (
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="btn-secondary"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  onClick={() => setOpen((o) => !o)}
                >
                  Log in
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M5.5 7.5 10 12l4.5-4.5H5.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {open && (
                  <div
                    role="menu"
                    aria-label="Choose a portal"
                    className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {PORTALS.map((p) => (
                      <Link
                        key={p.to}
                        to={p.to}
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                      >
                        {p.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
