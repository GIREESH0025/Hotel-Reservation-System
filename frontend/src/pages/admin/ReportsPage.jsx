import { useState } from 'react'
import { reportsApi } from '../../api/reports.api'
import { useFetch } from '../../hooks/useFetch'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { formatINR, formatDate, todayStr, daysFromTodayStr } from '../../utils/helpers'

export default function ReportsPage() {
  const [revenueFrom, setRevenueFrom] = useState(daysFromTodayStr(-30))
  const [revenueTo, setRevenueTo] = useState(todayStr())

  // 1. Summary today
  const { data: summary, loading: sumLoading, error: sumError } = useFetch(
    () => reportsApi.summary(),
    []
  )

  // 2. Revenue aggregation (date range)
  const { data: revenueData, loading: revLoading, error: revError, refetch: refetchRevenue } = useFetch(
    () => reportsApi.revenue({ from: revenueFrom, to: revenueTo }),
    [revenueFrom, revenueTo]
  )

  // 3. Occupancy aggregation
  const { data: occupancy, loading: occLoading, error: occError } = useFetch(
    () => reportsApi.occupancy(),
    []
  )

  const dailyRevenue = revenueData?.data || []
  const totalRevenue = revenueData?.totalRevenue || 0

  // Calculate highest revenue day for the pure-CSS bar chart scale
  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.totalRevenue), 1)

  return (
    <div className="page-container">
      <PageHeader
        title="Executive Reports & Analytics"
        subtitle="Financial ledger aggregation and chamber occupancy metrics."
      />

      {/* ── Section 1: Today's Operations Summary ── */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', marginBottom: '16px', borderBottom: 'var(--border)', paddingBottom: '8px' }}>
          Today's Operational Summary
        </h2>

        {sumLoading && <Skeleton height="80px" />}
        {sumError && <ErrorState message={sumError} />}

        {!sumLoading && !sumError && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ border: 'var(--border)', padding: '20px', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>Arrivals</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '4px 0 0', color: 'var(--color-moss)' }}>
                {summary?.arrivals ?? 0}
              </p>
            </div>
            <div style={{ border: 'var(--border)', padding: '20px', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>Departures</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '4px 0 0', color: 'var(--color-slate)' }}>
                {summary?.departures ?? 0}
              </p>
            </div>
            <div style={{ border: 'var(--border)', padding: '20px', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>In-House Chambers</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '4px 0 0', color: 'var(--color-ink)' }}>
                {summary?.inHouse ?? 0}
              </p>
            </div>
            <div style={{ border: 'var(--border)', padding: '20px', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>Pending Reservations</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', margin: '4px 0 0', color: 'var(--color-ochre)' }}>
                {summary?.pendingCount ?? 0}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ── Section 2: Revenue Report (Pure HTML/CSS Bar Chart) ── */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '16px', borderBottom: 'var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', margin: 0 }}>
              Revenue Performance
            </h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
              Total collections in period: <strong style={{ color: 'var(--color-laterite)' }}>{formatINR(totalRevenue)}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8125rem' }}>
              From:{' '}
              <input
                type="date"
                value={revenueFrom}
                onChange={(e) => setRevenueFrom(e.target.value)}
                style={{ padding: '4px 8px', border: 'var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-paper)' }}
              />
            </label>
            <label style={{ fontSize: '0.8125rem' }}>
              To:{' '}
              <input
                type="date"
                value={revenueTo}
                onChange={(e) => setRevenueTo(e.target.value)}
                style={{ padding: '4px 8px', border: 'var(--border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-paper)' }}
              />
            </label>
          </div>
        </div>

        {revLoading && <Skeleton height="200px" />}
        {revError && <ErrorState message={revError} onRetry={refetchRevenue} />}

        {!revLoading && !revError && dailyRevenue.length === 0 && (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--color-stone)', fontStyle: 'italic' }}>
            No revenue recorded within the selected period.
          </p>
        )}

        {!revLoading && !revError && dailyRevenue.length > 0 && (
          <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
            {/* Pure CSS Bar Chart — ruled lines, tabular numerals */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              height: '180px',
              paddingTop: '20px',
              borderBottom: '2px solid var(--color-ink)',
              overflowX: 'auto',
            }}>
              {dailyRevenue.map((day) => {
                const heightPercent = Math.max(8, Math.round((day.totalRevenue / maxDailyRevenue) * 100))
                return (
                  <div
                    key={day.date}
                    style={{
                      flex: '1',
                      minWidth: '24px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                    }}
                    title={`${day.date}: ${formatINR(day.totalRevenue)} (${day.count} payments)`}
                  >
                    <div style={{
                      width: '100%',
                      height: `${heightPercent}%`,
                      backgroundColor: 'var(--color-laterite)',
                      borderRadius: '1px 1px 0 0',
                      transition: 'height var(--transition)',
                    }} />
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-stone)', marginTop: '6px', whiteSpace: 'nowrap' }}>
                      {day.date.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '8px' }}>
              <span>Day-by-day cash flow receipt amounts</span>
              <span>Bar height normalized to peak daily collection ({formatINR(maxDailyRevenue)})</span>
            </div>
          </div>
        )}
      </section>

      {/* ── Section 3: Occupancy Report by Chamber Type ── */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', marginBottom: '16px', borderBottom: 'var(--border)', paddingBottom: '8px' }}>
          Current Chamber Occupancy Rate
        </h2>

        {occLoading && <Skeleton height="150px" />}
        {occError && <ErrorState message={occError} />}

        {!occLoading && !occError && (
          <div style={{ overflowX: 'auto', border: 'var(--border)', borderRadius: 'var(--radius)' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-ink)', backgroundColor: 'var(--color-paper)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', textTransform: 'uppercase', fontSize: '0.75rem' }}>Chamber Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.75rem' }}>Standard Rate</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.75rem' }}>Total Chambers</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.75rem' }}>Occupied</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.75rem' }}>Maintenance</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.75rem' }}>Available</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.75rem' }}>Occupancy Rate</th>
                </tr>
              </thead>
              <tbody>
                {occupancy && Array.isArray(occupancy) && occupancy.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: 'var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.roomType?.name || 'Category'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatINR(row.roomType?.baseRate)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.totalRooms}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-moss)' }}>
                      {row.activeRooms}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--color-ochre)' }}>
                      {row.maintenanceRooms}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {row.availableRooms}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                      {row.occupancyRate ?? 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

