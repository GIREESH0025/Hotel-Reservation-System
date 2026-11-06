import { useState } from 'react'

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
  const [focused, setFocused] = useState(false)

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.9375rem',
    color: '#111827',
    backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
    border: error
      ? '1.5px solid var(--color-error)'
      : focused
      ? '1.5px solid var(--color-primary)'
      : '1.5px solid #D1D5DB',
    borderRadius: '8px',
    outline: 'none',
    boxShadow: focused
      ? '0 0 0 3px rgba(214, 57, 65, 0.15)'
      : '0 1px 2px rgba(0, 0, 0, 0.05)',
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
      {hint && (
        <span id={hintId} style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
          {hint}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={(e) => {
          setFocused(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          props.onBlur?.(e)
        }}
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
          style={{ fontSize: '0.8125rem', color: 'var(--color-error)', fontWeight: 500, marginTop: '2px' }}
        >
          {error}
        </span>
      )}
    </div>
  )
}

