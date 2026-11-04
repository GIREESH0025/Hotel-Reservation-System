/**
 * Field — A labeled, controlled text/number/date/email/password input.
 * Always has a visible label. Shows error message below input.
 * Uses aria-describedby for accessibility.
 */
let idCounter = 0

export function Field({
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  required = false,
  disabled = false,
  placeholder,
  min,
  max,
  step,
  style: extraStyle = {},
  ...props
}) {
  const id = props.id || `field-${++idCounter}`
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.9375rem',
    color: 'var(--color-ink)',
    backgroundColor: 'var(--color-paper)',
    border: 'var(--border)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    borderColor: error ? 'var(--color-error)' : 'var(--color-rule)',
    transition: 'border-color var(--transition)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...extraStyle }}>
      <label
        htmlFor={id}
        style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-ink)' }}
      >
        {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: '2px' }} aria-hidden="true">*</span>}
      </label>
      {hint && (
        <span id={hintId} style={{ fontSize: '0.8125rem', color: 'var(--color-stone)' }}>
          {hint}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        style={inputStyle}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ fontSize: '0.8125rem', color: 'var(--color-error)' }}
        >
          {error}
        </span>
      )}
    </div>
  )
}

