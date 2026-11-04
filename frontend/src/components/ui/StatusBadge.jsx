import { statusColor } from '../../utils/helpers'

/**
 * StatusBadge — Small inline badge coloured by reservation/payment status.
 */
export function StatusBadge({ status }) {
  if (!status) return null
  const { color, bg } = statusColor(status)
  const label = status.replace(/_/g, ' ')

  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 'var(--radius)',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      textTransform: 'capitalize',
      color,
      backgroundColor: bg,
      border: `1px solid ${color}`,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {label}
    </span>
  )
}

