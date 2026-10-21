export default function Contact() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800">Contact us</h1>
      <p className="mt-3 text-slate-600">
        This is a demonstration project. The details below are fictional.
      </p>
      <div className="card mt-6 space-y-3 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-800">Clinic:</span> CareConnect Demo Clinic
        </p>
        <p>
          <span className="font-medium text-slate-800">Email:</span> support@careconnect.test
        </p>
        <p>
          <span className="font-medium text-slate-800">Phone:</span> +91 90000 00000
        </p>
        <p>
          <span className="font-medium text-slate-800">Hours:</span> Mon–Sat, 09:00–18:00
        </p>
      </div>
    </div>
  )
}
