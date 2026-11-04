/**
 * EmptyState — Shown when a list has no results.
 */
export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      borderTop: 'var(--border)',
    }}
    role="status"
    aria-live="polite"
    >
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.25rem',
        color: 'var(--color-stone)',
        marginBottom: message ? '8px' : '0',
      }}>
        {title}
      </p>
      {message && (
        <p style={{ color: 'var(--color-stone)', fontSize: '0.9375rem', marginBottom: '16px' }}>
          {message}
        </p>
      )}
      {action}
    </div>
  )
}

