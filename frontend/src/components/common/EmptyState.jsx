export default function EmptyState({ title, description, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-lg font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  )
}
