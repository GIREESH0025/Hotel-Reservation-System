import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { paymentsApi } from '../../api/payments.api'
import { useFetch } from '../../hooks/useFetch'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/Modal'
import { formatINR, formatDate } from '../../utils/helpers'

export default function MyReservationDetailPage() {
  const { id } = useParams()
  const { success, error } = useToast()
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Fetch reservation details (includes computed balance)
  const { data: reservation, loading: resLoading, error: resError, refetch } = useFetch(
    () => reservationsApi.get(id),
    [id]
  )

  // Fetch payments for this reservation
  const { data: paymentsData, loading: payLoading } = useFetch(
    () => paymentsApi.list({ reservationId: id }),
    [id]
  )

  const payments = paymentsData?.data || []

  const handleCancel = async () => {
    try {
      setCancelling(true)
      await reservationsApi.cancel(id)
      success('Reservation cancelled successfully.')
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel reservation.')
    } finally {
      setCancelling(false)
    }
  }

  if (resLoading) {
    return (
      <div className="page-container">
        <Skeleton height="36px" style={{ width: '300px', marginBottom: '16px' }} />
        <Skeleton height="300px" />
      </div>
    )
  }

  if (resError) {
    return (
      <div className="page-container">
        <ErrorState message={resError} onRetry={refetch} />
        <div style={{ marginTop: '16px' }}>
          <Link to="/my/reservations">&larr; Back to reservations</Link>
        </div>
      </div>
    )
  }

  if (!reservation) return null

  const canCancel = ['pending', 'confirmed'].includes(reservation.status)
  const balance = reservation.balance ?? reservation.totalAmount

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <PageHeader
        title={`Reservation ${reservation.reservationCode}`}
        subtitle={`Booked on ${formatDate(reservation.createdAt)}`}
      >
        <StatusBadge status={reservation.status} />
        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            loading={cancelling}
          >
            Cancel Stay
          </Button>
        )}
      </PageHeader>

      {/* Stay Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px',
        padding: '20px',
        border: 'var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: '32px',
        backgroundColor: 'var(--color-paper)',
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
            Chamber
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginTop: '4px' }}>
            {reservation.room?.roomType?.name || 'Standard'}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
            Chamber Number: {reservation.room?.number} (Floor {reservation.room?.floor})
          </p>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
            Stay Duration
          </span>
          <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '4px' }}>
            {formatDate(reservation.checkIn)} &rarr; {formatDate(reservation.checkOut)}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
            {reservation.nights} nights &bull; {reservation.adults} adult{reservation.adults > 1 ? 's' : ''}
          </p>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
            Guest Information
          </span>
          <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '4px' }}>
            {reservation.guest?.fullName}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
            {reservation.guest?.phone} {reservation.guest?.email ? `• ${reservation.guest.email}` : ''}
          </p>
        </div>
      </div>

      {reservation.notes && (
        <div style={{ padding: '16px', border: 'var(--border)', borderRadius: 'var(--radius)', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)', fontWeight: 600 }}>
            Special Notes
          </span>
          <p style={{ marginTop: '4px', fontSize: '0.9375rem' }}>{reservation.notes}</p>
        </div>
      )}

      {/* ── THE FOLIO VIEW (Memorable Element) ── */}
      <section style={{ border: 'var(--border)', padding: '28px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
        <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Harbour Row Hotel &bull; Folio Statement
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginTop: '4px' }}>
            Account Statement
          </h2>
        </div>

        {/* Dotted-leader line items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Room charge */}
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '0.9375rem' }}>
            <span>Room charge: {reservation.nights} night{reservation.nights > 1 ? 's' : ''} &times; {formatINR(reservation.ratePerNight)}/night</span>
            <div style={{ flex: 1, borderBottom: '1px dotted var(--color-rule)', margin: '0 8px' }} />
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatINR(reservation.totalAmount)}</span>
          </div>

          {/* Payment line items */}
          {payments.map((p) => (
            <div key={p._id} style={{ display: 'flex', alignItems: 'baseline', fontSize: '0.9375rem', color: p.status === 'paid' ? 'var(--color-moss)' : 'var(--color-stone)' }}>
              <span>
                Payment received ({p.method.toUpperCase()}{p.reference ? ` &bull; ${p.reference}` : ''}) &mdash; {formatDate(p.paidAt)}
                {p.status === 'refunded' && ' [REFUNDED]'}
              </span>
              <div style={{ flex: 1, borderBottom: '1px dotted var(--color-rule)', margin: '0 8px' }} />
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                {p.status === 'paid' ? `-${formatINR(p.amount)}` : `+${formatINR(p.amount)} (Refund)`}
              </span>
            </div>
          ))}

          {payments.length === 0 && (
            <p style={{ color: 'var(--color-stone)', fontSize: '0.875rem', fontStyle: 'italic', margin: '4px 0' }}>
              No payments recorded yet.
            </p>
          )}
        </div>

        {/* Totals Rule */}
        <div style={{ borderTop: '2px solid var(--color-ink)', marginTop: '20px', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9375rem' }}>
            <span>Total Charges</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatINR(reservation.totalAmount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9375rem' }}>
            <span>Total Payments</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--color-moss)' }}>
              {formatINR(reservation.totalAmount - balance)}
            </span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderTop: '1px solid var(--color-rule)',
            paddingTop: '12px',
            fontSize: '1.125rem',
            fontWeight: 700,
          }}>
            <span>Outstanding Balance</span>
            <span style={{
              fontVariantNumeric: 'tabular-nums',
              color: balance > 0 ? 'var(--color-error)' : 'var(--color-moss)',
            }}>
              {formatINR(balance)}
            </span>
          </div>
          {balance === 0 && (
            <p style={{ color: 'var(--color-moss)', fontSize: '0.75rem', textAlign: 'right', marginTop: '4px', fontWeight: 500 }}>
              &check; Folio settled in full
            </p>
          )}
        </div>
      </section>

      <div style={{ marginTop: '24px' }}>
        <Link to="/my/reservations" style={{ color: 'var(--color-laterite)', textDecoration: 'none' }}>
          &larr; Back to My Reservations
        </Link>
      </div>

      <ConfirmDialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message="Are you certain you wish to cancel this reservation? The reserved chamber dates will be released immediately."
        confirmLabel="Yes, Cancel Reservation"
        danger
      />
    </div>
  )
}
