import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { useFetch } from '../../hooks/useFetch'
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

  const { data, loading, error, refetch } = useFetch(
    () => reservationsApi.list({ page, limit: 10 }),
    [page]
  )

  const allReservations = data?.data || []
  const totalPages = data?.totalPages || 1

  // Filter into tabs
  const filteredReservations = allReservations.filter((r) => {
    if (activeTab === 'upcoming') return ['pending', 'confirmed'].includes(r.status)
    if (activeTab === 'past') return ['checked_in', 'checked_out', 'no_show'].includes(r.status)
    if (activeTab === 'cancelled') return r.status === 'cancelled'
    return true
  })

  // Count badges
  const upcomingCount = allReservations.filter((r) => ['pending', 'confirmed'].includes(r.status)).length
  const pastCount = allReservations.filter((r) => ['checked_out', 'checked_in', 'no_show'].includes(r.status)).length
  const cancelledCount = allReservations.filter((r) => r.status === 'cancelled').length

  const handleCancelConfirm = async () => {
    if (!cancelModalId) return
    try {
      setCancelling(true)
      await reservationsApi.cancel(cancelModalId)
      success('Your reservation has been cancelled. Chamber dates have been released.')
      setCancelModalId(null)
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
      render: (row) => (
        <div>
          <span style={{ fontWeight: 500, display: 'block' }}>{row.room?.roomType?.name || 'Chamber'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
            Room {row.room?.number || '—'} (Floor {row.room?.floor || '1'})
          </span>
        </div>
      ),
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
    <div className="page-container">
      <PageHeader
        title="My Bookings &amp; Register"
        subtitle="Review your current reservations, printable folios, and past history at Harbour Row Hotel."
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
