import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { paymentsApi } from '../../api/payments.api'
import { useFetch } from '../../hooks/useFetch'
import { useToast } from '../../context/ToastContext'
import { useTitle } from '../../hooks/useTitle'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/Modal'
import { DemoPaymentModal } from '../../components/payments/DemoPaymentModal'
import { BRAND_NAME } from '../../api/axios'
import { formatINR, formatDate } from '../../utils/helpers'

export default function MyReservationDetailPage() {
  const { id } = useParams()
  const { success, error } = useToast()
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)

  // Fetch reservation details (includes computed balance)
  const { data: reservation, loading: resLoading, error: resError, refetch } = useFetch(
    () => reservationsApi.get(id),
    [id]
  )

  // Fetch payments for this reservation
  const { data: paymentsData } = useFetch(
    () => paymentsApi.list({ reservationId: id }),
    [id]
  )

  const payments = paymentsData?.data || []
  useTitle(reservation?.reservationCode ? `Folio ${reservation.reservationCode}` : 'Folio Statement')

  const handleCancel = async () => {
    try {
      setCancelling(true)
      await reservationsApi.cancel(id)
      success('Reservation cancelled successfully.')
      setShowCancelModal(false)
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel reservation.')
    } finally {
      setCancelling(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (resLoading) {
    return (
      <div className="page-container" style={{ maxWidth: '840px' }}>
        <Skeleton height="36px" style={{ width: '320px', marginBottom: '16px' }} />
        <Skeleton height="360px" />
      </div>
    )
  }

  if (resError) {
    return (
      <div className="page-container" style={{ maxWidth: '840px' }}>
        <ErrorState message={resError} onRetry={refetch} />
        <div style={{ marginTop: '16px' }}>
          <Link to="/my/bookings">&larr; Back to my bookings</Link>
        </div>
      </div>
    )
  }

  if (!reservation) return null

  const canCancel = ['pending', 'confirmed'].includes(reservation.status)
  const balance = reservation.balance ?? reservation.totalAmount

  return (
    <div className="page-container" style={{ maxWidth: '840px', padding: '32px var(--content-pad)' }}>
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
          }
          .desktop-sidebar, .mobile-header, .no-print, header, footer {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .page-container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          .printable-folio {
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background-color: #fff !important;
            padding: 24px !important;
          }
          .print-header {
            display: block !important;
          }
        }
        @media screen {
          .print-header {
            display: none;
          }
        }
      `}</style>

      {/* Screen action header */}
      <div className="no-print">
        <PageHeader
          title={`Folio ${reservation.reservationCode}`}
          subtitle={`Guest folio registered on ${formatDate(reservation.createdAt)}`}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <StatusBadge status={reservation.status} />
            {balance > 0 && !['cancelled', 'checked_out', 'no_show'].includes(reservation.status) && (
              <Button variant="primary" size="sm" onClick={() => setShowPayModal(true)}>
                Pay Balance ({formatINR(balance)})
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              Print Folio / Invoice
            </Button>
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
          </div>
        </PageHeader>
      </div>

      {/* ── THE PRINTABLE FOLIO STATEMENT ── */}
      <article className="printable-folio" style={{
        border: 'var(--border)',
        padding: '36px',
        backgroundColor: 'var(--color-paper)',
        borderRadius: 'var(--radius)',
        position: 'relative',
      }}>
        {/* Folio Master Hotel Header */}
        <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                color: 'var(--color-ink)',
                display: 'block',
                lineHeight: 1.1,
              }}>
                {BRAND_NAME}
              </span>
              <span style={{
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-stone)',
                display: 'block',
                marginTop: '4px',
              }}>
                Official Guest Account Folio &amp; Invoice
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', marginTop: '4px', margin: 0 }}>
                Historic Harbour Quarter, Mumbai 400001 &bull; GSTIN: 27AABCH1234F1Z8
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
                Folio Code
              </span>
              <p style={{
                fontFamily: 'monospace',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-laterite)',
                margin: '2px 0 0 0',
              }}>
                {reservation.reservationCode}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
                Status: <strong>{reservation.status.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Guest & Stay Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--color-rule)',
          marginBottom: '28px',
        }}>
          <div>
            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
              Registered Patron
            </span>
            <p style={{ fontSize: '1.0625rem', fontWeight: 600, marginTop: '4px', margin: 0 }}>
              {reservation.guest?.fullName}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', margin: '4px 0 0 0' }}>
              Tel: {reservation.guest?.phone || '—'}
            </p>
            {reservation.guest?.email && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', margin: '2px 0 0 0' }}>
                Email: {reservation.guest.email}
              </p>
            )}
          </div>

          <div>
            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
              Chamber Allotment
            </span>
            <p style={{ fontSize: '1.0625rem', fontWeight: 600, marginTop: '4px', margin: 0 }}>
              {reservation.roomType?.name || reservation.room?.roomType?.name || (reservation.rooms?.[0]?.roomType?.name) || 'Chamber'}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', margin: '4px 0 0 0' }}>
              Chamber Number(s): <strong>
                {Array.isArray(reservation.rooms) && reservation.rooms.length > 0
                  ? reservation.rooms.map((r) => r.number || r).join(', ')
                  : (reservation.room?.number || '—')}
              </strong>
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', margin: '2px 0 0 0' }}>
              Base Rate: {formatINR(reservation.ratePerNight)} / night
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
              Stay Schedule
            </span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: '4px', margin: 0 }}>
              Arrival: {formatDate(reservation.checkIn)} (14:00)
            </p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '4px 0 0 0' }}>
              Departure: {formatDate(reservation.checkOut)} (11:00)
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', margin: '4px 0 0 0' }}>
              Duration: <strong>{reservation.nights} night{reservation.nights > 1 ? 's' : ''}</strong> &bull; {reservation.adults} guest{reservation.adults > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Itemized Folio Entries */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-stone)',
            fontWeight: 600,
            marginBottom: '16px',
          }}>
            Account Ledger &amp; Itemized Transactions
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Room Charges */}
            <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '0.9375rem' }}>
              <div>
                <strong>Lodging Charges</strong> &bull; {reservation.nights} night{reservation.nights > 1 ? 's' : ''} at {formatINR(reservation.ratePerNight)}
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-stone)' }}>
                  Occupancy: Chamber {reservation.room?.number} ({reservation.room?.roomType?.name})
                </span>
              </div>
              <div style={{ flex: 1, borderBottom: '1px dotted var(--color-rule)', margin: '0 12px' }} />
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {formatINR(reservation.totalAmount)}
              </span>
            </div>

            {/* Payments List */}
            {payments.map((p) => (
              <div key={p._id} style={{
                display: 'flex',
                alignItems: 'baseline',
                fontSize: '0.9375rem',
                color: p.status === 'paid' ? 'var(--color-moss)' : 'var(--color-stone)',
              }}>
                <div>
                  <strong>Payment Received</strong> &bull; {p.method.toUpperCase()}
                  {p.reference && <span> &bull; Ref: <code>{p.reference}</code></span>}
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-stone)' }}>
                    Processed on {formatDate(p.paidAt)} {p.status === 'refunded' ? '[REFUNDED]' : ''}
                  </span>
                </div>
                <div style={{ flex: 1, borderBottom: '1px dotted var(--color-rule)', margin: '0 12px' }} />
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {p.status === 'paid' ? `-${formatINR(p.amount)}` : `+${formatINR(p.amount)} (Refund)`}
                </span>
              </div>
            ))}

            {payments.length === 0 && (
              <p style={{ color: 'var(--color-stone)', fontSize: '0.875rem', fontStyle: 'italic', margin: '4px 0' }}>
                No advance remittances or payments recorded to date.
              </p>
            )}
          </div>
        </div>

        {/* Totals Summary Ledger */}
        <div style={{
          borderTop: '2px solid var(--color-ink)',
          paddingTop: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9375rem' }}>
            <span>Total Incurred Charges</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatINR(reservation.totalAmount)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9375rem' }}>
            <span>Total Payments &amp; Credits</span>
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
            fontSize: '1.25rem',
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

          <div style={{ marginTop: '16px', textAlign: 'right' }}>
            {balance === 0 ? (
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: 'var(--color-moss-bg)',
                color: 'var(--color-moss)',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}>
                &check; Account Settled in Full
              </span>
            ) : (
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: 'var(--color-ochre-bg)',
                color: 'var(--color-ochre)',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}>
                Payment Due Upon Departure
              </span>
            )}
          </div>
        </div>

        {/* Special Instructions */}
        {reservation.notes && (
          <div style={{
            marginTop: '24px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-stone-bg)',
            border: '1px solid var(--color-rule)',
            borderRadius: 'var(--radius)',
          }}>
            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', fontWeight: 600 }}>
              Patron Notes &amp; Requests
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>{reservation.notes}</p>
          </div>
        )}

        {/* Hotel Disclaimer / Seal */}
        <div style={{
          marginTop: '36px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-rule)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: '0.75rem',
          color: 'var(--color-stone)',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <p style={{ margin: 0 }}>This computer-generated statement serves as a valid invoice.</p>
            <p style={{ margin: '2px 0 0 0' }}>Thank you for staying at {BRAND_NAME}.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ width: '160px', borderBottom: '1px solid var(--color-ink)', marginBottom: '4px' }} />
            <span>Front Desk Cashier Signature</span>
          </div>
        </div>
      </article>

      <div style={{ marginTop: '24px' }} className="no-print">
        <Link to="/my/bookings" style={{ color: 'var(--color-laterite)', textDecoration: 'none', fontWeight: 500 }}>
          &larr; Return to My Bookings
        </Link>
      </div>

      <DemoPaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onSuccess={() => refetch()}
        reservationId={id}
        reservationCode={reservation.reservationCode}
        totalAmount={reservation.totalAmount}
        balance={balance}
        allowDeposit={!payments.some((p) => p.status === 'paid')}
        defaultType={payments.some((p) => p.status === 'paid') ? 'balance' : 'deposit'}
      />

      <ConfirmDialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message="Are you certain you wish to cancel this reservation? The chamber dates will be released and made available to other guests immediately."
        confirmLabel="Yes, Cancel Reservation"
        danger
        loading={cancelling}
      />
    </div>
  )
}
