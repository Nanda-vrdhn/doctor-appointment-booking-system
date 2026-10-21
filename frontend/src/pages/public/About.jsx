export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-800">About CareConnect</h1>
      <p className="mt-4 text-slate-600">
        CareConnect is a college mini-project demonstrating a full-stack doctor appointment
        booking system. It uses React and Tailwind CSS on the front end, Node.js and Express for
        the REST API, and a relational database for persistence.
      </p>
      <h2 className="mt-8 text-lg font-semibold text-slate-800">What it does</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
        <li>Patients can search doctors, check availability and book appointments.</li>
        <li>Doctors can manage their schedule and accept, reject or complete appointments.</li>
        <li>Admins can manage doctors, users, specializations and review appointments.</li>
      </ul>
      <h2 className="mt-8 text-lg font-semibold text-slate-800">Demonstration data</h2>
      <p className="mt-3 text-slate-600">
        Every doctor, patient and appointment in this system is fictional. No real medical
        information is stored or displayed.
      </p>
    </div>
  )
}
