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
    padding: '10px 14px',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.9375rem',
    color: value ? '#111827' : '#6B7280',
    backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
    border: error ? '1.5px solid var(--color-error)' : '1.5px solid #D1D5DB',
    borderRadius: '8px',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'auto',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...extraStyle }}>
      <label
        htmlFor={id}
        style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}
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

