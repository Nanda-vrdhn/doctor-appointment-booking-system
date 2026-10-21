/** Consistent success envelopes: { "data": ... } */
export const ok = (res, data, status = 200) => res.status(status).json({ data })
export const created = (res, data) => res.status(201).json({ data })

/** Shape a database user row into the public profile (never exposes the hash). */
export function publicUser(row) {
  if (!row) return null
  return {
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  }
}
