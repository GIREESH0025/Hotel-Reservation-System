/**
 * ErrorState — Shown when a data fetch fails.
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      padding: '32px 24px',
      border: '1px solid var(--color-error)',
      borderRadius: 'var(--radius)',
      backgroundColor: 'var(--color-error-bg)',
    }}
    role="alert"
    aria-live="assertive"
    >
      <p style={{
        fontWeight: 600,
        color: 'var(--color-error)',
        marginBottom: '8px',
      }}>
        Could not load data
      </p>
      <p style={{ color: 'var(--color-error)', fontSize: '0.9375rem', marginBottom: onRetry ? '16px' : '0' }}>
        {message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: 'var(--color-error)',
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}

