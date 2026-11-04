import { useState } from 'react'
import { Link } from 'react-router-dom'
import { paymentsApi } from '../../api/payments.api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useFetch } from '../../hooks/useFetch'
import { useRefresh } from '../../context/RefreshContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { formatINR, formatDate } from '../../utils/helpers'

export default function PaymentsPage() {
  const [page, setPage] = useState(1)
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [refundPaymentId, setRefundPaymentId] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  const { user } = useAuth()
  const { success, error: toastError } = useToast()
  const { refreshTick, triggerRefresh } = useRefresh()

  const { data, loading, error, refetch } = useFetch(
    () => paymentsApi.list({
      page,
      limit: 15,
      method: methodFilter || undefined,
      status: statusFilter || undefined,
    }),
    [page, methodFilter, statusFilter, refreshTick]
  )

  const payments = (Array.isArray(data) ? data : data?.data) || []
  const totalPages = data?.totalPages || 1

  const handleRefund = async (e) => {
    e.preventDefault()
    if (!refundPaymentId) return
    try {
      setRefunding(true)
      await paymentsApi.refund(refundPaymentId, { reason: refundReason.trim() })
      success('Refund processed successfully.')
      setRefundPaymentId(null)
      setRefundReason('')
      triggerRefresh()
      refetch()
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to process refund.')
    } finally {
      setRefunding(false)
    }
  }

  const columns = [
    {
      key: 'reservation',
      header: 'Folio Code',
      sortable: true,
      render: (row) => (
        <Link
          to={`/staff/reservations/${row.reservation?._id}`}
          style={{ fontWeight: 600, color: 'var(--color-laterite)' }}
        >
          {row.reservation?.reservationCode || '—'}
        </Link>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      render: (row) => {
        const isRefund = row.type === 'refund' || row.status === 'refunded'
        return (
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isRefund ? 'var(--color-slate)' : 'var(--color-moss)' }}>
            {isRefund ? `-${formatINR(row.amount)}` : formatINR(row.amount)}
          </span>
        )
      },
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => (
        <span style={{ textTransform: 'uppercase', fontSize: '0.8125rem' }}>
          {row.method === 'demo_online' ? 'Online' : row.method}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span style={{ textTransform: 'capitalize', fontSize: '0.8125rem', fontWeight: 500 }}>
          {row.type || 'Standard'}
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
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
          {row.reference || '—'}
        </span>
      ),
    },
    {
      key: 'receivedBy',
      header: 'Received By',
      render: (row) => row.receivedBy?.name || 'Online Gateway',
    },
    {
      key: 'paidAt',
      header: 'Date & Time',
      sortable: true,
      render: (row) => formatDate(row.paidAt),
    },
    ...(user?.role === 'admin' ? [{
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        row.status === 'paid' && row.type !== 'refund' ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRefundPaymentId(row._id)}
          >
            Refund
          </Button>
        ) : null
      ),
    }] : []),
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
          <option value="demo_online">Demo Online</option>
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

      {loading && <SkeletonTable rows={8} cols={8} />}

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

      {/* Admin Refund Modal */}
      <Modal
        isOpen={!!refundPaymentId}
        onClose={() => setRefundPaymentId(null)}
        title="Process Payment Refund"
        maxWidth="480px"
      >
        <form onSubmit={handleRefund}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', marginBottom: '16px' }}>
            This will issue a refund transaction against the original payment. The refunded amount will be credited back to the customer.
          </p>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
              Refund Reason (optional)
            </label>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Guest requested cancellation / billing adjustment"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: '#fff',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setRefundPaymentId(null)} type="button">
              Cancel
            </Button>
            <Button variant="danger" type="submit" loading={refunding}>
              Confirm Refund
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
