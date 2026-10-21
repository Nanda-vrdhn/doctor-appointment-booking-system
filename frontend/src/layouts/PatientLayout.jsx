import { Outlet } from 'react-router-dom'
import DashboardShell from '../components/common/DashboardShell.jsx'

const NAV = [
  { to: '/patient/dashboard', label: 'Dashboard', end: true },
  { to: '/patient/appointments', label: 'My Appointments' },
  { to: '/patient/profile', label: 'Profile & Settings' },
]

export default function PatientLayout() {
  return (
    <DashboardShell role="Patient" navItems={NAV}>
      <Outlet />
    </DashboardShell>
  )
}
