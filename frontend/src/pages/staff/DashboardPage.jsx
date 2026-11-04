import { Link } from 'react-router-dom'
import { reportsApi } from '../../api/reports.api'
import { reservationsApi } from '../../api/reservations.api'
import { useFetch } from '../../hooks/useFetch'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { todayStr, formatDate, formatINR } from '../../utils/helpers'

export default function DashboardPage() {
  const today = todayStr()

  // Fetch summary counts
  const { data: summary, loading: sumLoading, error: sumError, refetch: refetchSummary } = useFetch(
    () => reportsApi.summary(),
    []
  )

  // Fetch today's arrivals (confirmed reservations with checkIn <= today)
  const { data: arrivalsData, loading: arrLoading } = useFetch(
    () => reservationsApi.list({ status: 'confirmed', limit: 10 }),
    []
  )

  // Fetch today's in-house / departures (checked_in reservations)
  const { data: inHouseData, loading: inHouseLoading } = useFetch(
    () => reservationsApi.list({ status: 'checked_in', limit: 10 }),
    []
  )

  const arrivals = arrivalsData?.data || []
  const inHouse = inHouseData?.data || []

  const arrivalColumns = [
    {
      key: 'reservationCode',
      header: 'Code',
      render: (row) => (
        <Link to={`/staff/reservations/${row._id}`} style={{ fontWeight: 600, color: 'var(--color-laterite)' }}>
          {row.reservationCode}
        </Link>
      ),
    },
    { key: 'guest', header: 'Guest', render: (row) => row.guest?.fullName || '—' },
    { key: 'room', header: 'Chamber', render: (row) => `${row.room?.number} (${row.room?.roomType?.name || ''})` },
    { key: 'checkIn', header: 'Arrival', render: (row) => formatDate(row.checkIn) },
    { key: 'totalAmount', header: 'Total', numeric: true, render: (row) => formatINR(row.totalAmount) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  const inHouseColumns = [
    {
      key: 'reservationCode',
      header: 'Code',
      render: (row) => (
        <Link to={`/staff/reservations/${row._id}`} style={{ fontWeight: 600, color: 'var(--color-laterite)' }}>
          {row.reservationCode}
        </Link>
      ),
    },
    { key: 'guest', header: 'Guest', render: (row) => row.guest?.fullName || '—' },
    { key: 'room', header: 'Chamber', render: (row) => `${row.room?.number} (${row.room?.roomType?.name || ''})` },
    { key: 'checkOut', header: 'Expected Departure', render: (row) => formatDate(row.checkOut) },
    { key: 'totalAmount', header: 'Total', numeric: true, render: (row) => formatINR(row.totalAmount) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Reception Desk Operations"
        subtitle={`Register for ${formatDate(today, 'long')} &bull; Today's operational summary`}
      >
        <Link to="/staff/reservations/new">
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-laterite)',
              color: 'var(--color-paper)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            + New Reservation
          </button>
        </Link>
      </PageHeader>

      {sumError && <ErrorState message={sumError} onRetry={refetchSummary} />}

      {/* 3 Stat blocks — 1px borders, ruled editorial register style */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '36px',
      }}>
        <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
            Arrivals Today
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', margin: '8px 0 0', color: 'var(--color-moss)' }}>
            {sumLoading ? '—' : summary?.arrivals ?? 0}
          </p>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)' }}>Confirmed reservations</span>
        </div>

        <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
            Departures Today
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', margin: '8px 0 0', color: 'var(--color-slate)' }}>
            {sumLoading ? '—' : summary?.departures ?? 0}
          </p>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)' }}>Checked-in guests checking out</span>
        </div>

        <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
            In-House Guests
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', margin: '8px 0 0', color: 'var(--color-ink)' }}>
            {sumLoading ? '—' : summary?.inHouse ?? 0}
          </p>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)' }}>Current occupied chambers</span>
        </div>

        <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
            Pending Bookings
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', margin: '8px 0 0', color: 'var(--color-ochre)' }}>
            {sumLoading ? '—' : summary?.pendingCount ?? 0}
          </p>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)' }}>Awaiting confirmation</span>
        </div>
      </div>

      {/* Today's Arrivals Section */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: 'var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
            Expected Arrivals
          </h2>
          <Link to="/staff/reservations?status=confirmed" style={{ fontSize: '0.875rem' }}>
            View all confirmed &rarr;
          </Link>
        </div>
        {arrLoading ? (
          <Skeleton height="120px" />
        ) : (
          <DataTable
            columns={arrivalColumns}
            data={arrivals}
            keyField="_id"
            emptyMessage="No guest arrivals scheduled for today."
          />
        )}
      </section>

      {/* Currently In-House Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: 'var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
            Currently In-House
          </h2>
          <Link to="/staff/reservations?status=checked_in" style={{ fontSize: '0.875rem' }}>
            View all in-house &rarr;
          </Link>
        </div>
        {inHouseLoading ? (
          <Skeleton height="120px" />
        ) : (
          <DataTable
            columns={inHouseColumns}
            data={inHouse}
            keyField="_id"
            emptyMessage="No guests currently in-house."
          />
        )}
      </section>
    </div>
  )
}
