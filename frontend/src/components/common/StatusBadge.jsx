import { STATUS_LABELS, STATUS_STYLES } from '../../utils/constants.js'

export default function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status
  const style = STATUS_STYLES[status] || 'bg-slate-200 text-slate-700'
  return <span className={`badge ${style}`}>{label}</span>
}
