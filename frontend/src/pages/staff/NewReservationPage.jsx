import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { roomsApi } from '../../api/rooms.api'
import { guestsApi } from '../../api/guests.api'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { todayStr, daysFromTodayStr, computeNights, formatINR } from '../../utils/helpers'

export default function NewReservationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const prefilledRoomId = searchParams.get('roomId') || ''
  const prefilledCheckIn = searchParams.get('checkIn') || todayStr()

  const [guestId, setGuestId] = useState('')
  const [roomId, setRoomId] = useState(prefilledRoomId)
  const [checkIn, setCheckIn] = useState(prefilledCheckIn)
  const [checkOut, setCheckOut] = useState(daysFromTodayStr(2))
  const [adults, setAdults] = useState(1)
  const [notes, setNotes] = useState('')

  const [guests, setGuests] = useState([])
  const [rooms, setRooms] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [conflictError, setConflictError] = useState('')

  // Load guests and rooms for selection
  useEffect(() => {
    const loadData = async () => {
      try {
        const [guestsRes, roomsRes] = await Promise.all([
          guestsApi.list({ limit: 100 }),
          roomsApi.list({ limit: 100, status: 'active' }),
        ])
        setGuests(guestsRes.data?.data || [])
        setRooms(roomsRes.data?.data || [])
      } catch (err) {
        error('Failed to load guest and chamber lists.')
      }
    }
    loadData()
  }, [])

  // Selected room details for rate display
  const selectedRoom = rooms.find((r) => r._id === roomId)
  const nights = computeNights(checkIn, checkOut)
  const ratePerNight = selectedRoom
    ? selectedRoom.rateOverride != null ? selectedRoom.rateOverride : selectedRoom.roomType?.baseRate || 0
    : 0
  const totalAmount = ratePerNight * nights

  const handleSubmit = async (e) => {
    e.preventDefault()
    setConflictError('')

    const errs = {}
    if (!guestId) errs.guestId = 'Please select a guest'
    if (!roomId) errs.roomId = 'Please select a chamber'
    if (!checkIn) errs.checkIn = 'Check-in date is required'
    if (!checkOut) errs.checkOut = 'Check-out date is required'
    if (checkIn && checkOut && checkOut <= checkIn) {
      errs.checkOut = 'Check-out must be after check-in'
    }
    if (nights > 30) {
      errs.checkOut = 'Stay cannot exceed 30 nights'
    }
    if (!adults || adults < 1) {
      errs.adults = 'At least 1 adult required'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    try {
      setLoading(true)
      const res = await reservationsApi.create({
        guestId,
        roomId,
        checkIn,
        checkOut,
        adults,
        notes: notes.trim(),
      })
      const created = res.data?.data
      success(`Reservation ${created?.reservationCode} recorded successfully!`)
      navigate(`/staff/reservations/${created?._id}`)
    } catch (err) {
      if (err.response?.status === 409) {
        setConflictError(err.response.data.message || 'Date conflict: this chamber is already reserved for the chosen dates.')
      } else {
        error(err.response?.data?.message || 'Failed to create reservation.')
      }
    } finally {
      setLoading(false)
    }
  }

  const guestOptions = guests.map((g) => ({
    value: g._id,
    label: `${g.fullName} (${g.phone || g.email || 'No contact'})`,
  }))

  const roomOptions = rooms.map((r) => {
    const rate = r.rateOverride != null ? r.rateOverride : r.roomType?.baseRate || 0
    return {
      value: r._id,
      label: `Chamber ${r.number} — ${r.roomType?.name || 'Room'} (${formatINR(rate)}/night)`,
    }
  })

  return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      <PageHeader
        title="Record New Reservation"
        subtitle="Enter guest particulars and assign a chamber for their stay."
      />

      {conflictError && (
        <div
          role="alert"
          style={{
            padding: '16px',
            border: '1px solid var(--color-error)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius)',
            marginBottom: '24px',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
          }}
        >
          <strong>409 Conflict:</strong> {conflictError}
        </div>
      )}

      <div style={{ border: 'var(--border)', padding: '28px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select Guest</span>
            <Link to="/staff/guests" style={{ fontSize: '0.8125rem' }}>+ New Guest Record</Link>
          </div>
          <Select
            label=""
            value={guestId}
            onChange={(e) => {
              setGuestId(e.target.value)
              if (errors.guestId) setErrors((prev) => ({ ...prev, guestId: '' }))
            }}
            options={guestOptions}
            error={errors.guestId}
            placeholder="Search and choose guest…"
            required
            style={{ marginBottom: '16px' }}
          />

          <Select
            label="Chamber"
            value={roomId}
            onChange={(e) => {
              setRoomId(e.target.value)
              if (errors.roomId) setErrors((prev) => ({ ...prev, roomId: '' }))
            }}
            options={roomOptions}
            error={errors.roomId}
            placeholder="Choose active chamber…"
            required
            style={{ marginBottom: '16px' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Field
              label="Arrival Date"
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value)
                if (errors.checkIn) setErrors((prev) => ({ ...prev, checkIn: '' }))
              }}
              error={errors.checkIn}
              required
            />

            <Field
              label="Departure Date"
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => {
                setCheckOut(e.target.value)
                if (errors.checkOut) setErrors((prev) => ({ ...prev, checkOut: '' }))
              }}
              error={errors.checkOut}
              required
            />
          </div>

          <Field
            label="Adult Guests"
            type="number"
            min="1"
            max="10"
            value={adults}
            onChange={(e) => {
              setAdults(parseInt(e.target.value, 10) || 1)
              if (errors.adults) setErrors((prev) => ({ ...prev, adults: '' }))
            }}
            error={errors.adults}
            required
            style={{ marginBottom: '16px' }}
          />

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="notes" style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '4px' }}>
              Staff Notes (optional)
            </label>
            <textarea
              id="notes"
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP guest, requested late checkout, paid in advance"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-paper)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.9375rem',
              }}
            />
          </div>

          {/* Live Folio Calculation Box */}
          {selectedRoom && nights > 0 && (
            <div style={{ border: '1px solid var(--color-ink)', padding: '16px', marginBottom: '24px', backgroundColor: 'var(--color-paper)' }}>
              <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
                Live Folio Computation
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.875rem' }}>
                <span>Rate per Night:</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatINR(ratePerNight)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.875rem' }}>
                <span>Stay Duration:</span>
                <span>{nights} night{nights > 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-rule)', fontWeight: 700, fontSize: '1.0625rem' }}>
                <span>Total Expected Charges:</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-laterite)' }}>
                  {formatINR(totalAmount)}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <Link to="/staff/reservations" style={{ color: 'var(--color-stone)', textDecoration: 'none', fontSize: '0.875rem' }}>
              Cancel
            </Link>
            <Button type="submit" variant="primary" loading={loading}>
              Create Reservation
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

