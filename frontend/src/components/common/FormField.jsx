export default function FormField({ label, error, htmlFor, children }) {
  return (
    <div>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
