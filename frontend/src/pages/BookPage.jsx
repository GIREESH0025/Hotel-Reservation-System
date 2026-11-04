import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { reservationsApi } from '../api/reservations.api'
import { roomTypesApi } from '../api/roomTypes.api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { formatINR, formatDate, computeNights } from '../utils/helpers'
import { useTitle } from '../hooks/useTitle'

export default function BookPage() {
  useTitle('Review & Confirm Stay')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error } = useToast()

  const roomId = searchParams.get('roomId')
  const roomTypeId = searchParams.get('roomTypeId')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const adults = parseInt(searchParams.get('adults'), 10) || 1
  const rateParam = parseFloat(searchParams.get('rate')) || 0

  const [roomType, setRoomType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [notes, setNotes] = useState('')

  const nights = computeNights(checkIn, checkOut)
  const ratePerNight = rateParam || roomType?.baseRate || 0
  const estimatedTotal = ratePerNight * nights

  useEffect(() => {
    if (!roomTypeId) {
      setFetchError('Missing booking parameters. Please choose a room from the availability search.')
      setLoading(false)
      return
    }

    const fetchDetails = async () => {
      try {
        setLoading(true)
        const res = await roomTypesApi.get(roomTypeId)
        setRoomType(res.data?.data)
      } catch (err) {
        setFetchError('Unable to load room details. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [roomTypeId])

  const handleConfirm = async (e) => {
    e.preventDefault()
    if (!roomId || !checkIn || !checkOut) {
      error('Missing reservation details.')
      return
    }

    try {
      setSubmitting(true)
      const res = await reservationsApi.create({
        roomId,
        checkIn,
        checkOut,
        adults,
        notes: notes.trim(),
      })
      const code = res.data?.data?.reservationCode
      success(`Reservation confirmed! Code: ${code}`)
      navigate(`/my/bookings/${res.data?.data?._id || ''}`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. The room may have been reserved by another guest.'
      error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '640px', margin: '48px auto', padding: '0 16px' }}>
        <Skeleton height="40px" style={{ marginBottom: '16px' }} />
        <Skeleton height="200px" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div style={{ maxWidth: '640px', margin: '48px auto', padding: '0 16px' }}>
        <ErrorState message={fetchError} />
        <div style={{ marginTop: '16px' }}>
          <Link to="/" style={{ color: 'var(--color-laterite)' }}>&larr; Return to Availability Search</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '640px', margin: '48px auto', padding: '0 16px' }}>
      <div style={{ border: 'var(--border)', padding: '32px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
        <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '16px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Harbour Row Hotel &bull; Folio Confirmation
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: '4px' }}>
            Confirm Reservation
          </h1>
        </div>

        {/* Guest Information */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)', marginBottom: '8px' }}>
            Primary Guest
          </h4>
          <p style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{user?.name}</p>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.875rem' }}>{user?.email} {user?.phone ? `&bull; ${user.phone}` : ''}</p>
        </div>

        {/* Stay Summary Styled as Hotel Bill */}
        <div style={{ borderTop: 'var(--border)', borderBottom: 'var(--border)', padding: '16px 0', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)', marginBottom: '12px' }}>
            Stay Particulars
          </h4>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Room Type</span>
            <span style={{ fontWeight: 600 }}>{roomType?.name}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Dates</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatDate(checkIn)} &rarr; {formatDate(checkOut)}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Duration & Guests</span>
            <span>{nights} night{nights > 1 ? 's' : ''} &bull; {adults} adult{adults > 1 ? 's' : ''}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>Nightly Rate</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(ratePerNight)}</span>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-ink)',
            fontWeight: 700,
            fontSize: '1.125rem',
          }}>
            <span>Estimated Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-laterite)' }}>
              {formatINR(estimatedTotal)}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '4px', textAlign: 'right' }}>
            Payment is due upon arrival at the reception desk.
          </p>
        </div>

        {/* Special requests / Notes */}
        <form onSubmit={handleConfirm}>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="notes" style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '6px' }}>
              Special Requests (optional)
            </label>
            <textarea
              id="notes"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Quiet room, late arrival, extra towels"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.9375rem',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-paper)',
                color: 'var(--color-ink)',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'var(--color-stone)', textDecoration: 'none', fontSize: '0.875rem' }}>
              Cancel
            </Link>
            <Button type="submit" variant="primary" loading={submitting}>
              Confirm & Book
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

