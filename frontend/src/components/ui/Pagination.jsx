/**
 * Pagination — Prev/Next controls with page info.
 */
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const style = {
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 0',
      fontSize: '0.875rem',
    },
    btn: (disabled) => ({
      padding: '6px 14px',
      backgroundColor: 'transparent',
      border: 'var(--border)',
      borderRadius: 'var(--radius)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-ui)',
      fontSize: '0.875rem',
      color: disabled ? 'var(--color-stone)' : 'var(--color-ink)',
      opacity: disabled ? 0.5 : 1,
      transition: 'background-color var(--transition)',
    }),
    info: { color: 'var(--color-stone)' },
  }

  return (
    <div style={style.wrapper} role="navigation" aria-label="Pagination">
      <button
        style={style.btn(page <= 1)}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      <span style={style.info}>
        Page {page} of {totalPages}
      </span>
      <button
        style={style.btn(page >= totalPages)}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  )
}

