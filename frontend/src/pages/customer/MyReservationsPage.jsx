import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { useFetch } from '../../hooks/useFetch'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { formatINR, formatDate } from '../../utils/helpers'

export default function MyReservationsPage() {
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useFetch(
    () => reservationsApi.list({ page, limit: 10 }),
    [page]
  )

  const reservations = data?.data || []
  const totalPages = data?.totalPages || 1

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
      header: 'Room Type',
      render: (row) => (
        <span>
          {row.room?.roomType?.name || 'Room'} (Chamber {row.room?.number || '—'})
        </span>
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
      header: 'Total',
      numeric: true,
      render: (row) => formatINR(row.totalAmount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="My Reservations"
        subtitle="Review your current, upcoming, and past stays at Harbour Row Hotel."
      />

      {loading && <SkeletonTable rows={5} cols={6} />}

      {error && (
        <ErrorState message={error} onRetry={refetch} />
      )}

      {!loading && !error && (
        <>
          <DataTable
            columns={columns}
            data={reservations}
            keyField="_id"
            onRowClick={(row) => navigate(`/my/reservations/${row._id}`)}
            emptyMessage="You have no reservations recorded. Book a room from the front desk search."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  )
}
