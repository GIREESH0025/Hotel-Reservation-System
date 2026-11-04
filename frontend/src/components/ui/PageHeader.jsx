/**
 * PageHeader — Consistent page header with title, optional subtitle, and right-side actions.
 */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '16px',
      paddingBottom: '16px',
      borderBottom: 'var(--border)',
      marginBottom: '24px',
      flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--color-stone)', marginTop: '4px', fontSize: '0.9375rem' }}>{subtitle}</p>}
      </div>
      {children && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  )
}

