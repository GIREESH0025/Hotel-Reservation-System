import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { useFetch } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { SearchBar } from '../../components/ui/SearchBar'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { formatINR, formatDate } from '../../utils/helpers'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

export default function ReservationsListPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const navigate = useNavigate()

  const { data, loading, error, refetch } = useFetch(
    () => reservationsApi.list({
      page,
      limit: 15,
      status: statusFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    [page, statusFilter, debouncedSearch]
  )

  const reservations = data?.data || []
  const totalPages = data?.totalPages || 1

  const columns = [
    {
      key: 'reservationCode',
      header: 'Folio Code',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-laterite)' }}>
          {row.reservationCode}
        </span>
      ),
    },
    {
      key: 'guest',
      header: 'Guest Name',
      sortable: true,
      render: (row) => row.guest?.fullName || '—',
    },
    {
      key: 'room',
      header: 'Chamber',
      render: (row) => `${row.room?.number || '—'} (${row.room?.roomType?.name || ''})`,
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
      render: (row) => formatINR(row.totalAmount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <span style={{ color: 'var(--color-laterite)', fontSize: '0.8125rem', fontWeight: 500 }}>
          View &rarr;
        </span>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Reservations Register"
        subtitle="Complete ledger of all hotel reservations and booking states."
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

      {/* Filters row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '240px' }}>
          <SearchBar
            value={searchInput}
            onChange={(val) => { setSearchInput(val); setPage(1); }}
            placeholder="Search by reservation code or notes…"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-paper)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <SkeletonTable rows={8} cols={7} />}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <DataTable
            columns={columns}
            data={reservations}
            keyField="_id"
            onRowClick={(row) => navigate(`/staff/reservations/${row._id}`)}
            emptyMessage="No reservations match the specified query."
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

