import { useState } from 'react'

/**
 * DataTable — Reusable, accessible table with sortable columns,
 * responsive mobile stacking (cards via data-label), loading, and empty states.
 * 
 * Props:
 * - columns: Array of { key, header, render?, sortable?, numeric? }
 * - data: Array of row objects
 * - keyField: Field name to use as React key (default '_id' or 'id')
 * - onRowClick: Optional callback(row)
 * - loading: Boolean
 * - emptyMessage: String
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = '_id',
  onRowClick,
  loading = false,
  emptyMessage = 'No records found.',
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' | 'desc'

  const handleHeaderClick = (col) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortOrder('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    let aVal = a[sortKey]
    let bVal = b[sortKey]

    if (aVal == null) aVal = ''
    if (bVal == null) bVal = ''

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }

    const cmp = String(aVal).localeCompare(String(bVal))
    return sortOrder === 'asc' ? cmp : -cmp
  })

  return (
    <div style={{ width: '100%', overflowX: 'auto', border: 'var(--border)', borderRadius: 'var(--radius)' }}>
      <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-ink)', backgroundColor: 'var(--color-paper)' }}>
            {columns.map((col) => {
              const isSorted = sortKey === col.key
              return (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col)}
                  className={col.numeric ? 'num' : ''}
                  style={{
                    padding: '12px 16px',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-ink)',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    textAlign: col.numeric ? 'right' : 'left',
                    whiteSpace: 'nowrap',
                  }}
                  aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    {col.sortable && (
                      <span style={{ fontSize: '0.75rem', opacity: isSorted ? 1 : 0.3 }}>
                        {isSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--color-stone)',
                  fontStyle: 'italic',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => {
              const rowKey = row[keyField] || row.id || idx
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{
                    borderBottom: 'var(--border)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color var(--transition)',
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) e.currentTarget.style.backgroundColor = 'var(--color-rule)'
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      data-label={col.header}
                      className={col.numeric ? 'num' : ''}
                      style={{
                        padding: '12px 16px',
                        verticalAlign: 'middle',
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: col.numeric ? 'right' : 'left',
                      }}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
