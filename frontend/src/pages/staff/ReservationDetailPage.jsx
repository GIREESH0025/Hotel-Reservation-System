import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { paymentsApi } from '../../api/payments.api'
import { useFetch } from '../../hooks/useFetch'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { ConfirmDialog } from '../../components/ui/Modal'
import { formatINR, formatDate } from '../../utils/helpers'

export default function ReservationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()

  // State for recording payment
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('card')
  const [payReference, setPayReference] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState('')

  // State for actions
  const [actionLoading, setActionLoading] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Fetch reservation details (includes computed balance)
  const { data: reservation, loading: resLoading, error: resError, refetch } = useFetch(
    () => reservationsApi.get(id),
    [id]
  )

  // Fetch payments for this reservation
  const { data: paymentsData, refetch: refetchPayments } = useFetch(
    () => paymentsApi.list({ reservationId: id }),
    [id]
  )

  const payments = paymentsData?.data || []
  const balance = reservation?.balance ?? reservation?.totalAmount ?? 0

  // Action handlers
  const handleConfirm = async () => {
    try {
      setActionLoading(true)
      await reservationsApi.confirm(id)
      success('Reservation confirmed.')
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to confirm reservation.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setActionLoading(true)
      await reservationsApi.checkIn(id)
      success('Guest checked in successfully.')
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Check-in failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setActionLoading(true)
      await reservationsApi.checkOut(id)
      success('Guest checked out successfully.')
      refetch()
    } catch (err) {
      // 409 if balance > 0
      error(err.response?.data?.message || 'Check-out failed. Balance must equal 0.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      setActionLoading(true)
      await reservationsApi.cancel(id)
      success('Reservation cancelled.')
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel reservation.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    setPayError('')

    const parsed = parseFloat(payAmount)
    if (isNaN(parsed) || parsed <= 0) {
      setPayError('Payment amount must be greater than 0.')
      return
    }
    if (parsed > balance + 0.001) {
      setPayError(`Payment cannot exceed outstanding balance of ${formatINR(balance)}.`)
      return
    }

    try {
      setPayLoading(true)
      await paymentsApi.create({
        reservationId: id,
        amount: parsed,
        method: payMethod,
        reference: payReference.trim() || undefined,
      })
      success(`Payment of ${formatINR(parsed)} recorded.`)
      setPayAmount('')
      setPayReference('')
      refetch()
      refetchPayments()
    } catch (err) {
      setPayError(err.response?.data?.message || 'Failed to record payment.')
    } finally {
      setPayLoading(false)
    }
  }

  if (resLoading) {
    return (
      <div className="page-container">
        <Skeleton height="40px" style={{ marginBottom: '16px' }} />
        <Skeleton height="350px" />
      </div>
    )
  }

  if (resError) {
    return (
      <div className="page-container">
        <ErrorState message={resError} onRetry={refetch} />
        <div style={{ marginTop: '16px' }}>
          <Link to="/staff/reservations">&larr; Return to reservations</Link>
        </div>
      </div>
    )
  }

  if (!reservation) return null

  const isPending = reservation.status === 'pending'
  const isConfirmed = reservation.status === 'confirmed'
  const isCheckedIn = reservation.status === 'checked_in'
  const canCancel = ['pending', 'confirmed'].includes(reservation.status)

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      <PageHeader
        title={`Folio ${reservation.reservationCode}`}
        subtitle={`Registered by ${reservation.createdBy?.name || 'Staff'} on ${formatDate(reservation.createdAt)}`}
      >
        <StatusBadge status={reservation.status} />

        {isPending && (
          <Button variant="primary" size="sm" onClick={handleConfirm} loading={actionLoading}>
            Confirm Reservation
          </Button>
        )}

        {isConfirmed && (
          <Button variant="primary" size="sm" onClick={handleCheckIn} loading={actionLoading}>
            Check In Guest
          </Button>
        )}

        {isCheckedIn && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (balance > 0) {
                error(`Cannot check out — outstanding balance of ${formatINR(balance)} remains. Collect payment first.`)
              } else {
                setShowCheckoutModal(true)
              }
            }}
            loading={actionLoading}
          >
            Check Out Guest
          </Button>
        )}

        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            loading={actionLoading}
          >
            Cancel Reservation
          </Button>
        )}
      </PageHeader>

      {/* Main Grid: Details & Folio */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Guest & Stay Details Card */}
        <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '16px' }}>
            Guest & Chamber
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
              Guest
            </span>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>{reservation.guest?.fullName}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
              Phone: {reservation.guest?.phone || '—'} &bull; Email: {reservation.guest?.email || '—'}
            </p>
            {reservation.guest?.idProof && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', marginTop: '2px' }}>
                ID Proof: {reservation.guest.idProof}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
              Chamber Assigned
            </span>
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>
              Chamber {reservation.room?.number} &mdash; {reservation.room?.roomType?.name}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
              Floor {reservation.room?.floor} &bull; Capacity: up to {reservation.room?.roomType?.capacity || 2} adults
            </p>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
              Dates of Stay
            </span>
            <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              {formatDate(reservation.checkIn)} &rarr; {formatDate(reservation.checkOut)}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
              {reservation.nights} nights &bull; {reservation.adults} adult{reservation.adults > 1 ? 's' : ''}
            </p>
          </div>

          {reservation.notes && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: 'var(--border)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)', fontWeight: 600 }}>
                Special Requests
              </span>
              <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>{reservation.notes}</p>
            </div>
          )}
        </div>

        {/* ── THE FOLIO VIEW ── */}
        <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
          <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
              Financial Register
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginTop: '2px' }}>
              Guest Folio
            </h3>
          </div>

          {/* Dotted leaders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span>Room: {reservation.nights}n &times; {formatINR(reservation.ratePerNight)}</span>
              <div style={{ flex: 1, borderBottom: '1px dotted var(--color-rule)', margin: '0 8px' }} />
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatINR(reservation.totalAmount)}</span>
            </div>

            {payments.map((p) => (
              <div key={p._id} style={{ display: 'flex', alignItems: 'baseline', color: p.status === 'paid' ? 'var(--color-moss)' : 'var(--color-stone)' }}>
                <span>Paid ({p.method.toUpperCase()}) &bull; {formatDate(p.paidAt)}</span>
                <div style={{ flex: 1, borderBottom: '1px dotted var(--color-rule)', margin: '0 8px' }} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatINR(p.amount)}</span>
              </div>
            ))}
          </div>

          {/* Totals and balance rule */}
          <div style={{ borderTop: '2px solid var(--color-ink)', marginTop: '16px', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '4px' }}>
              <span>Total Charges</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatINR(reservation.totalAmount)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px', color: 'var(--color-moss)' }}>
              <span>Total Payments</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {formatINR(reservation.totalAmount - balance)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderTop: '1px solid var(--color-rule)',
              paddingTop: '8px',
              fontWeight: 700,
              fontSize: '1.125rem',
            }}>
              <span>Outstanding Balance</span>
              <span style={{
                fontVariantNumeric: 'tabular-nums',
                color: balance > 0 ? 'var(--color-error)' : 'var(--color-moss)',
              }}>
                {formatINR(balance)}
              </span>
            </div>
            {balance > 0 && (
              <p style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px' }}>
                * Balance must be settled prior to guest checkout.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Form (Staff only, if balance > 0) */}
      {balance > 0 && ['pending', 'confirmed', 'checked_in'].includes(reservation.status) && (
        <section style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '8px' }}>
            Record Payment
          </h3>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.875rem', marginBottom: '16px' }}>
            Accept cash, card, or UPI payment against this folio. Maximum acceptable: {formatINR(balance)}.
          </p>

          {payError && (
            <div role="alert" style={{ padding: '8px 12px', backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius)', fontSize: '0.875rem', marginBottom: '16px' }}>
              {payError}
            </div>
          )}

          <form onSubmit={handleRecordPayment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            <Field
              label="Amount (INR)"
              type="number"
              step="0.01"
              min="0.01"
              max={balance}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`Up to ${balance}`}
              required
            />

            <Select
              label="Payment Method"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Credit / Debit Card' },
                { value: 'upi', label: 'UPI' },
              ]}
              required
            />

            <Field
              label="Reference / Transaction ID"
              type="text"
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              placeholder="e.g. UPI Ref / Card Last 4"
            />

            <div>
              <Button type="submit" variant="primary" loading={payLoading} style={{ width: '100%' }}>
                Record Payment
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onConfirm={handleCheckOut}
        title="Confirm Guest Checkout"
        message={`Confirm checkout for Chamber ${reservation.room?.number}. Outstanding balance is ₹0.00. Chamber will be marked vacant.`}
        confirmLabel="Check Out Guest"
      />

      <ConfirmDialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message="Are you certain you wish to cancel this reservation? The chamber dates will be freed on the tape chart."
        confirmLabel="Yes, Cancel Reservation"
        danger
      />
    </div>
  )
}
