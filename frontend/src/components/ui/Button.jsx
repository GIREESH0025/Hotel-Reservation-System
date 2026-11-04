/**
 * Button — Rectangular, no pills. Variants: primary, secondary, ghost, danger.
 * Supports loading state (shows spinner text, disables interaction).
 */
const variantStyles = {
  primary: {
    backgroundColor: 'var(--color-laterite)',
    color: 'var(--color-paper)',
    border: '1px solid var(--color-laterite)',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-ink)',
    border: 'var(--border)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-ink)',
    border: '1px solid transparent',
  },
  danger: {
    backgroundColor: 'var(--color-error)',
    color: 'var(--color-paper)',
    border: '1px solid var(--color-error)',
  },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  style: extraStyle = {},
  ...props
}) {
  const sizeStyle = size === 'sm'
    ? { padding: '6px 12px', fontSize: '0.8125rem' }
    : size === 'lg'
    ? { padding: '12px 24px', fontSize: '1rem' }
    : { padding: '9px 18px', fontSize: '0.9375rem' }

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontFamily: 'var(--font-ui)',
    fontWeight: 500,
    lineHeight: 1.4,
    borderRadius: 'var(--radius)',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    opacity: loading || disabled ? 0.6 : 1,
    transition: 'opacity var(--transition), background-color var(--transition)',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    ...variantStyles[variant] || variantStyles.primary,
    ...sizeStyle,
    ...extraStyle,
  }

  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      style={baseStyle}
      {...props}
    >
      {loading ? 'Loading…' : children}
    </button>
  )
}

