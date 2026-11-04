/**
 * Skeleton — Loading placeholder elements.
 */
export function Skeleton({ width = '100%', height = '20px', style: extra = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, ...extra }}
      aria-hidden="true"
    />
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div style={{ padding: '16px 0' }} aria-busy="true" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height="20px" style={{ flex: 1 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

