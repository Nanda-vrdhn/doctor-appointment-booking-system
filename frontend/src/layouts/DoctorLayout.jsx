import { Outlet } from 'react-router-dom'
import DashboardShell from '../components/common/DashboardShell.jsx'

const NAV = [
  { to: '/doctor/dashboard', label: 'Dashboard', end: true },
  { to: '/doctor/appointments', label: 'Appointments' },
  { to: '/doctor/availability', label: 'Availability' },
  { to: '/doctor/profile', label: 'My Profile' },
]

export default function DoctorLayout() {
  return (
    <DashboardShell role="Doctor" navItems={NAV}>
      <Outlet />
    </DashboardShell>
  )
}
