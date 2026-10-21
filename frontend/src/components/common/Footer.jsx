import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-slate-600 md:grid-cols-3">
        <div>
          <p className="font-semibold text-brand-800">CareConnect</p>
          <p className="mt-2">
            Book trusted doctors online. See real availability and confirm your appointment in
            seconds.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-700">Explore</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link to="/doctors" className="hover:text-brand-600">
                Find Doctors
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-brand-600">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-brand-600">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-700">Portals</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link to="/login/patient" className="hover:text-brand-600">
                Patient login
              </Link>
            </li>
            <li>
              <Link to="/login/doctor" className="hover:text-brand-600">
                Doctor login
              </Link>
            </li>
            <li>
              <Link to="/login/admin" className="hover:text-brand-600">
                Administrator login
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © 2026 CareConnect. All rights reserved.
      </div>
    </footer>
  )
}
