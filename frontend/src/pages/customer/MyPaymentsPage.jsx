import { useState } from 'react'
import { Link } from 'react-router-dom'
import { paymentsApi } from '../../api/payments.api'
import { useFetch } from '../../hooks/useFetch'
import { useRefresh } from '../../context/RefreshContext'
import { useTitle } from '../../hooks/useTitle'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { formatINR, formatDate } from '../../utils/helpers'

export default function MyPaymentsPage() {
  useTitle('Payment History')
  const [page, setPage] = useState(1)
  const { refreshTick } = useRefresh()

  const { data, loading, error, refetch } = useFetch(
    () => paymentsApi.list({ page, limit: 10 }),
    [page, refreshTick]
  )

  const payments = (Array.isArray(data) ? data : data?.data) || []
  const totalPages = data?.totalPages || 1

  const totalPaid = payments
    .filter((p) => p.status === 'paid' && p.type !== 'refund')
    .reduce((sum, p) => sum + p.amount, 0)
  const totalRefunded = payments
    .filter((p) => p.type === 'refund' || p.status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0)

  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-ink)' }}>
          {row.reference || '—'}
        </span>
      ),
    },
    {
      key: 'reservation',
      header: 'Stay Folio',
      render: (row) => (
        <Link
          to={`/my/bookings/${row.reservation?._id || ''}`}
          style={{ fontWeight: 600, color: 'var(--color-laterite)', textDecoration: 'none' }}
        >
          {row.reservation?.reservationCode || 'View Folio'}
        </Link>
      ),
    },
    {
      key: 'paidAt',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.paidAt),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
          {row.type || 'Standard'}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => (
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            fontSize: '0.75rem',
            border: '1px solid var(--color-rule)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            backgroundColor: '#fff',
          }}
        >
          {row.method === 'demo_online' ? 'Online' : row.method}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      render: (row) => {
        const isRefund = row.type === 'refund' || row.status === 'refunded'
        return (
          <span
            style={{
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: isRefund ? 'var(--color-slate)' : 'var(--color-moss)',
            }}
          >
            {isRefund ? `-${formatINR(row.amount)}` : formatINR(row.amount)}
          </span>
        )
      },
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
        title="Payment & Remittance History"
        subtitle="Itemized receipts and financial settlements for your stays."
      />

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ border: 'var(--border)', padding: '20px', backgroundColor: '#fff', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-stone)', fontWeight: 600 }}>
            Total Remitted
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: '4px 0 0', color: 'var(--color-moss)' }}>
            {formatINR(totalPaid)}
          </p>
        </div>

        <div style={{ border: 'var(--border)', padding: '20px', backgroundColor: '#fff', borderRadius: 'var(--radius)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-stone)', fontWeight: 600 }}>
            Refunds Processed
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: '4px 0 0', color: 'var(--color-slate)' }}>
            {formatINR(totalRefunded)}
          </p>
        </div>
      </div>

      {loading && <SkeletonTable rows={5} cols={7} />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          <DataTable
            columns={columns}
            data={payments}
            keyField="_id"
            emptyMessage="No payment transactions recorded for your account."
          />
          {totalPages > 1 && (
            <div style={{ marginTop: '24px' }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

