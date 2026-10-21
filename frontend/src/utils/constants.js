/** Shared labels and status styling. Status is never conveyed by colour alone. */

export const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-brand-100 text-brand-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
}

export const SLOT_STATUS_LABELS = {
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',
}
