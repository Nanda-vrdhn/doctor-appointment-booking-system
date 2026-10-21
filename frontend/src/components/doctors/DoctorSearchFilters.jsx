export default function DoctorSearchFilters({ filters, specializations, onChange, onSubmit }) {
  return (
    <form
      className="card flex flex-col gap-3 md:flex-row md:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="flex-1">
        <label htmlFor="filter-name" className="label">
          Doctor name
        </label>
        <input
          id="filter-name"
          className="input"
          placeholder="e.g. Dr. Asha Rao"
          value={filters.name}
          onChange={(e) => onChange({ ...filters, name: e.target.value })}
        />
      </div>
      <div className="md:w-56">
        <label htmlFor="filter-spec" className="label">
          Specialization
        </label>
        <select
          id="filter-spec"
          className="input"
          value={filters.specializationId}
          onChange={(e) => onChange({ ...filters, specializationId: e.target.value })}
        >
          <option value="">All specializations</option>
          {specializations.map((s) => (
            <option key={s.specialization_id} value={s.specialization_id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="md:w-44">
        <label htmlFor="filter-date" className="label">
          Available on
        </label>
        <input
          id="filter-date"
          type="date"
          className="input"
          value={filters.date}
          onChange={(e) => onChange({ ...filters, date: e.target.value })}
        />
      </div>
      <button type="submit" className="btn-primary md:w-28">
        Search
      </button>
    </form>
  )
}
