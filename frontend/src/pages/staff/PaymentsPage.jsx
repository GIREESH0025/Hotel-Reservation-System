import { useState } from 'react'
import { Link } from 'react-router-dom'
import { paymentsApi } from '../../api/payments.api'
import { useFetch } from '../../hooks/useFetch'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { formatINR, formatDate } from '../../utils/helpers'

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, loading, error, refetch } = useFetch(
    () => paymentsApi.list({
      page,
      limit: 15,
      method: methodFilter || undefined,
      status: statusFilter || undefined,
    }),
    [page, methodFilter, statusFilter]
  )

  const payments = data?.data || []
  const totalPages = data?.totalPages || 1

  const columns = [
    {
      key: 'reservation',
      header: 'Reservation Code',
      render: (row) => (
        <Link to={`/staff/reservations/${row.reservation?._id}`} style={{ fontWeight: 600, color: 'var(--color-laterite)' }}>
          {row.reservation?.reservationCode || '—'}
        </Link>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      numeric: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatINR(row.amount)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => (
        <span style={{ textTransform: 'uppercase', fontSize: '0.8125rem' }}>
          {row.method}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => row.reference || '—',
    },
    {
      key: 'receivedBy',
      header: 'Received By',
      render: (row) => row.receivedBy?.name || 'Staff',
    },
    {
      key: 'paidAt',
      header: 'Date & Time',
      sortable: true,
      render: (row) => formatDate(row.paidAt),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Payment Transactions"
        subtitle="Full audit trail of cash, card, and UPI receipts credited against guest folios."
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-paper)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
          }}
        >
          <option value="">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
        </select>

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
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading && <SkeletonTable rows={8} cols={7} />}

      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <DataTable
            columns={columns}
            data={payments}
            keyField="_id"
            emptyMessage="No payment records found."
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
