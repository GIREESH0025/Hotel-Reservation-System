import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { useFetch } from '../../hooks/useFetch'
import { useRefresh } from '../../context/RefreshContext'
import { useToast } from '../../context/ToastContext'
import { useTitle } from '../../hooks/useTitle'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { formatINR, formatDate } from '../../utils/helpers'

const TABS = [
  { id: 'all', label: 'All Stays' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past Stays' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function MyReservationsPage() {
  useTitle('My Bookings')
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('all')
  const [cancelModalId, setCancelModalId] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const { refreshTick, triggerRefresh } = useRefresh()

  const { data, loading, error, refetch } = useFetch(
    () => reservationsApi.list({ page, limit: 10 }),
    [page, refreshTick]
  )

  const allReservations = (Array.isArray(data) ? data : data?.data) || []
  const totalPages = data?.totalPages || 1

  // Date-only comparison in IST (Asia/Kolkata)
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  const toDateStr = (d) => {
    if (!d) return ''
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(d))
  }

  // Filter into tabs
  const filteredReservations = allReservations.filter((r) => {
    if (activeTab === 'cancelled') return r.status === 'cancelled'
    if (r.status === 'cancelled') return false

    const checkOutStr = toDateStr(r.checkOut)
    const isPastStay = r.status === 'checked_out' || r.status === 'no_show' || checkOutStr < todayStr

    if (activeTab === 'upcoming') {
      return !isPastStay && ['pending', 'confirmed', 'checked_in'].includes(r.status)
    }
    if (activeTab === 'past') {
      return isPastStay
    }
    return true
  })

  // Count badges
  const upcomingCount = allReservations.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'no_show' && r.status !== 'checked_out' && toDateStr(r.checkOut) >= todayStr
  ).length
  const pastCount = allReservations.filter(
    (r) => r.status === 'checked_out' || r.status === 'no_show' || (r.status !== 'cancelled' && toDateStr(r.checkOut) < todayStr)
  ).length
  const cancelledCount = allReservations.filter((r) => r.status === 'cancelled').length

  const handleCancelConfirm = async () => {
    if (!cancelModalId) return
    try {
      setCancelling(true)
      await reservationsApi.cancel(cancelModalId)
      success('Your reservation has been cancelled. Chamber dates have been released.')
      setCancelModalId(null)
      triggerRefresh()
      refetch()
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to cancel reservation.')
    } finally {
      setCancelling(false)
    }
  }

  const columns = [
    {
      key: 'reservationCode',
      header: 'Reservation Code',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-laterite)' }}>
          {row.reservationCode}
        </span>
      ),
    },
    {
      key: 'room',
      header: 'Chamber & Type',
      render: (row) => {
        const roomNumbers = Array.isArray(row.rooms) && row.rooms.length > 0
          ? row.rooms.map((r) => r.number || r).join(', ')
          : (row.room?.number || '—')
        const typeName =
          row.roomType?.name ||
          row.room?.roomType?.name ||
          (row.rooms?.[0]?.roomType?.name) ||
          'Chamber'
        return (
          <div>
            <span style={{ fontWeight: 600, display: 'block' }}>{typeName}</span>
            <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
              Room {roomNumbers} {Array.isArray(row.rooms) && row.rooms.length > 1 ? `(${row.rooms.length} rooms)` : ''}
            </span>
          </div>
        )
      },
    },
    {
      key: 'checkIn',
      header: 'Arrival',
      sortable: true,
      render: (row) => formatDate(row.checkIn),
    },
    {
      key: 'checkOut',
      header: 'Departure',
      sortable: true,
      render: (row) => formatDate(row.checkOut),
    },
    {
      key: 'nights',
      header: 'Nights',
      numeric: true,
    },
    {
      key: 'totalAmount',
      header: 'Total Charges',
      numeric: true,
      render: (row) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {formatINR(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Folio & Actions',
      render: (row) => {
        const canCancel = ['pending', 'confirmed'].includes(row.status)
        return (
          <div
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              to={`/my/bookings/${row._id}`}
              style={{
                color: 'var(--color-laterite)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              View Folio &rarr;
            </Link>
            {canCancel && (
              <button
                onClick={() => setCancelModalId(row._id)}
                style={{
                  padding: '3px 8px',
                  backgroundColor: 'transparent',
                  color: 'var(--color-stone)',
                  border: '1px solid var(--color-rule)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="page-container" style={{ padding: '32px var(--content-pad)' }}>
      <PageHeader
        title="My Bookings"
        subtitle="Review your current reservations, itemized stay folios, and booking history."
      >
        <Link to="/">
          <Button variant="primary" size="sm">
            + Book Another Stay
          </Button>
        </Link>
      </PageHeader>

      {/* Tabs Row */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: 'var(--border)',
        marginBottom: '24px',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          let count = 0
          if (tab.id === 'all') count = allReservations.length
          if (tab.id === 'upcoming') count = upcomingCount
          if (tab.id === 'past') count = pastCount
          if (tab.id === 'cancelled') count = cancelledCount

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--color-laterite)' : '2px solid transparent',
                padding: '10px 16px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-laterite)' : 'var(--color-stone)',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: '0.6875rem',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: isActive ? 'rgba(164, 68, 42, 0.1)' : 'var(--color-stone-bg)',
                color: isActive ? 'var(--color-laterite)' : 'var(--color-stone)',
                fontWeight: 600,
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading && <SkeletonTable rows={5} cols={7} />}

      {error && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {!loading && !error && (
        <>
          <DataTable
            columns={columns}
            data={filteredReservations}
            keyField="_id"
            onRowClick={(row) => navigate(`/my/bookings/${row._id}`)}
            emptyMessage={
              activeTab === 'upcoming'
                ? 'You have no upcoming stays planned. Explore our available chambers from the front desk.'
                : activeTab === 'cancelled'
                ? 'No cancelled reservations on record.'
                : 'No bookings match this category.'
            }
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelModalId)}
        onClose={() => setCancelModalId(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Reservation"
        message="Are you sure you wish to cancel this stay? Your chamber dates will be released and made available to other patrons immediately."
        confirmLabel="Confirm Cancellation"
        danger
        loading={cancelling}
      />
    </div>
  )
}
