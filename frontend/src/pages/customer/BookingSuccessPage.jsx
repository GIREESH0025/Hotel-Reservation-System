import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { reservationsApi } from '../../api/reservations.api'
import { useTitle } from '../../hooks/useTitle'
import { HOTEL_CONFIG } from '../../config/hotel.config'
import { formatINR, formatLongDate, formatISODate } from '../../utils/helpers'
import { useToast } from '../../context/ToastContext'

export default function BookingSuccessPage() {
  const { id } = useParams()
  useTitle('Booking Confirmed — Harbour Row Hotel')
  const { addToast } = useToast()

  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    async function loadReservation() {
      try {
        setLoading(true)
        const res = await reservationsApi.get(id)
        setReservation(res.data?.data || null)
      } catch (err) {
        console.error('Failed to load booking:', err)
      } finally {
        setLoading(false)
      }
    }
    loadReservation()
  }, [id])

  const handleCopyCode = () => {
    if (!reservation?.reservationCode) return
    navigator.clipboard?.writeText(reservation.reservationCode)
    setCopiedCode(true)
    addToast('Reservation code copied to clipboard!', 'success')
    setTimeout(() => setCopiedCode(false), 3000)
  }

  // Generate .ics calendar file client-side
  const handleDownloadICS = () => {
    if (!reservation) return

    const ciDate = new Date(reservation.checkIn)
    const coDate = new Date(reservation.checkOut)

    const startStr = `${formatISODate(ciDate).replace(/-/g, '')}T140000Z`
    const endStr = `${formatISODate(coDate).replace(/-/g, '')}T110000Z`

    const roomTitle =
      reservation.roomType?.name ||
      reservation.room?.roomType?.name ||
      reservation.rooms?.[0]?.roomType?.name ||
      'Harbour Row Stay'

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Harbour Row Hotel//Booking System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${reservation._id}@harbourrow.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:Stay at Harbour Row Hotel (${roomTitle})`,
      `DESCRIPTION:Reservation Reference: ${reservation.reservationCode}\\nGuests: ${reservation.adults} adults\\nTotal: ₹${reservation.totalAmount}`,
      `LOCATION:Harbour Row Hotel, Colaba, Mumbai, Maharashtra 400001, India`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `${reservation.reservationCode}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addToast('Calendar event downloaded (.ics)', 'success')
  }

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 40, width: '40%', margin: '0 auto 20px' }} />
        <div className="skeleton" style={{ height: 260, width: '100%', borderRadius: 16 }} />
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="page-container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Booking not found</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
          Return to Home
        </Link>
      </div>
    )
  }

  const roomTitle =
    reservation.roomType?.name ||
    reservation.room?.roomType?.name ||
    reservation.rooms?.[0]?.roomType?.name ||
    'Selected Room'

  const balance = reservation.balance ?? 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', padding: '48px 24px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Success Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #E5E7EB',
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Green check circle */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#ECFDF5',
              color: '#059669',
              fontSize: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            ✓
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            Your Stay is Confirmed!
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#4B5563', marginBottom: 24 }}>
            A formal confirmation voucher has been recorded. We look forward to welcoming you to {HOTEL_CONFIG.name}.
          </p>

          {/* Reservation Code Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              background: '#F9FAFB',
              border: '1.5px dashed #D1D5DB',
              borderRadius: 12,
              padding: '10px 20px',
              marginBottom: 28,
            }}
          >
            <div>
              <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block', textTransform: 'uppercase' }}>
                Booking Reference
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', letterSpacing: '0.04em' }}>
                {reservation.reservationCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              style={{
                background: copiedCode ? '#ECFDF5' : '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: copiedCode ? '#059669' : '#374151',
              }}
            >
              {copiedCode ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Stay Breakdown Details */}
          <div
            style={{
              background: '#F9FAFB',
              borderRadius: 12,
              padding: '20px',
              textAlign: 'left',
              marginBottom: 28,
              fontSize: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Chamber Category:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>{roomTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Check-in:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>
                {formatLongDate(reservation.checkIn)} (from 14:00)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Check-out:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>
                {formatLongDate(reservation.checkOut)} (by 11:00)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Stay Duration:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>
                {reservation.nights} {reservation.nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Guests:</span>
              <span style={{ fontWeight: 700, color: '#111827' }}>
                {reservation.adults} Adults
              </span>
            </div>

            <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Total Amount:</span>
              <span style={{ fontWeight: 800, color: '#111827' }}>{formatINR(reservation.totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Outstanding Balance at Front Desk:</span>
              <span style={{ fontWeight: 700, color: balance > 0 ? '#B45309' : 'var(--color-success)' }}>
                {balance > 0 ? formatINR(balance) : 'Fully Paid ✓'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={handleDownloadICS}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 9999,
                border: '1.5px solid #111827',
                background: '#FFFFFF',
                color: '#111827',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              📅 Add to Calendar (.ics)
            </button>

            <Link
              to={`/my/bookings/${reservation._id}`}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: '0.9375rem',
                textAlign: 'center',
              }}
            >
              View Reservation Folio &amp; Tax Invoice →
            </Link>

            <Link
              to="/my/bookings"
              style={{
                color: '#6B7280',
                fontSize: '0.875rem',
                textDecoration: 'none',
                marginTop: 8,
              }}
            >
              Go to My Bookings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

