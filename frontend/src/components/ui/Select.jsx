/**
 * Select — Controlled select element with label and error message.
 */
let idCounter = 0

export function Select({
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  placeholder = 'Select…',
  style: extraStyle = {},
  ...props
}) {
  const id = props.id || `select-${++idCounter}`
  const errorId = `${id}-error`

  const selectStyle = {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.9375rem',
    color: value ? 'var(--color-ink)' : 'var(--color-stone)',
    backgroundColor: 'var(--color-paper)',
    border: '1px solid',
    borderColor: error ? 'var(--color-error)' : 'var(--color-rule)',
    borderRadius: 'var(--radius)',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'auto',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...extraStyle }}>
      <label
        htmlFor={id}
        style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-ink)' }}
      >
        {label}{required && <span style={{ color: 'var(--color-error)', marginLeft: '2px' }} aria-hidden="true">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={selectStyle}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} role="alert" style={{ fontSize: '0.8125rem', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

