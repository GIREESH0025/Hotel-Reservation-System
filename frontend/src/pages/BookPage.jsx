import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { reservationsApi } from '../api/reservations.api'
import { paymentsApi } from '../api/payments.api'
import { roomTypesApi } from '../api/roomTypes.api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useRefresh } from '../context/RefreshContext'
import { useBooking } from '../context/BookingContext'
import { useTitle } from '../hooks/useTitle'
import { HOTEL_CONFIG } from '../config/hotel.config'
import Stepper from '../components/ui/Stepper'
import BackConfirmModal from '../components/ui/BackConfirmModal'
import FareBreakup from '../components/ui/FareBreakup'
import { formatINR, formatShortDate, formatLongDate, todayStr, daysFromTodayStr, computeNights } from '../utils/helpers'

export default function BookPage() {
  useTitle('Book Your Stay — Harbour Row Hotel')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { addToast } = useToast()
  const { triggerRefresh } = useRefresh()
  const { draft, updateDraft, clearDraft } = useBooking()

  // 1. Wizard Step State (1: Details, 2: Traveller Info, 3: Pay)
  const [currentStep, setCurrentStep] = useState(1)
  const [showExitModal, setShowExitModal] = useState(false)

  // 2. Initial Booking Parameters
  const roomTypeId = searchParams.get('roomTypeId') || draft?.roomTypeId || ''
  const checkIn = searchParams.get('checkIn') || draft?.checkIn || todayStr()
  const checkOut = searchParams.get('checkOut') || draft?.checkOut || daysFromTodayStr(2)
  const roomsCount = Math.max(1, parseInt(searchParams.get('rooms') || draft?.rooms || '1', 10))
  const adults = Math.max(1, parseInt(searchParams.get('adults') || draft?.adults || '2', 10))
  const initialChildren = draft?.children || []
  const initialRatePlan = searchParams.get('ratePlan') || draft?.ratePlan || 'room_only'

  const nights = computeNights(checkIn, checkOut)

  const [roomType, setRoomType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ratePlan, setRatePlan] = useState(initialRatePlan)

  // Step 2 Form State (Traveller Info)
  const [bookingFor, setBookingFor] = useState('myself') // 'myself' | 'other'
  const [fullName, setFullName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone?.replace('+91', '').trim() || '')
  const [arrivalTime, setArrivalTime] = useState('14:00 – 16:00')
  const [specialRequests, setSpecialRequests] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Step 3 State (Payment & Coupon)
  const [couponInput, setCouponInput] = useState(draft?.couponCode || '')
  const [appliedCoupon, setAppliedCoupon] = useState(draft?.couponCode || '')
  const [paymentMethod, setPaymentMethod] = useState('upi') // 'upi' | 'card' | 'netbanking' | 'hotel'
  const [paymentChoice, setPaymentChoice] = useState('full') // 'full' | 'deposit' | 'hotel'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [upiQrScanned, setUpiQrScanned] = useState(false)

  // Server quote
  const [quote, setQuote] = useState(draft?.quote || null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  // Fetch Room Type
  useEffect(() => {
    if (!roomTypeId) {
      navigate('/search')
      return
    }
    async function loadRoom() {
      try {
        setLoading(true)
        const res = await roomTypesApi.get(roomTypeId)
        setRoomType(res.data?.data || null)
      } catch (err) {
        console.error('Failed to load room type:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRoom()
  }, [roomTypeId, navigate])

  // Recalculate Quote on parameter change
  useEffect(() => {
    if (!roomTypeId) return
    async function fetchQuote() {
      try {
        setQuoteLoading(true)
        const res = await reservationsApi.quote({
          roomTypeId,
          checkIn,
          checkOut,
          rooms: roomsCount,
          adults,
          children: initialChildren,
          ratePlan,
          couponCode: appliedCoupon || null,
        })
        const q = res.data?.data || null
        setQuote(q)
        updateDraft({ quote: q, couponCode: appliedCoupon, ratePlan })
      } catch (err) {
        console.error('Quote error:', err)
      } finally {
        setQuoteLoading(false)
      }
    }
    fetchQuote()
  }, [roomTypeId, checkIn, checkOut, roomsCount, adults, initialChildren.length, ratePlan, appliedCoupon])

  // Apply Coupon Code
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault()
    if (!couponInput.trim()) return
    setAppliedCoupon(couponInput.trim().toUpperCase())
  }

  // Handle Step 1 -> Step 2
  const handleProceedToTravellerInfo = () => {
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle Step 2 -> Step 3 Validation
  const handleProceedToPayment = (e) => {
    if (e) e.preventDefault()
    const errs = {}
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Full name is required (minimum 2 letters)'
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = 'Valid email address is required for booking confirmation'
    }
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Valid 10-digit mobile number is required'
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    setFormErrors({})
    updateDraft({
      guestSnapshot: {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: `+91 ${cleanPhone}`,
      },
      specialRequests,
      arrivalTime,
    })
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Final Booking Submission (Atomic)
  const handleConfirmBooking = async () => {
    try {
      setIsSubmitting(true)
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // 1. Create Reservation
      const resPayload = {
        roomTypeId,
        roomsCount,
        checkIn,
        checkOut,
        adults,
        children: initialChildren,
        ratePlan,
        couponCode: appliedCoupon || undefined,
        guestSnapshot: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: `+91 ${phone.replace(/\D/g, '')}`,
        },
        specialRequests,
        arrivalTime,
        notes: specialRequests ? `Arrival: ${arrivalTime}. Requests: ${specialRequests}` : `Arrival: ${arrivalTime}`,
      }

      const createRes = await reservationsApi.create(resPayload)
      const createdRes = createRes.data?.data
      if (!createdRes?._id) throw new Error('Failed to create reservation record')

      // 2. Record Payment if deposit or full payment chosen
      if (paymentChoice === 'deposit' || paymentChoice === 'full') {
        const amountType = paymentChoice === 'deposit' ? 'deposit' : 'full'
        await paymentsApi.payReservation(createdRes._id, {
          amountType,
          method: 'demo_online',
          idempotencyKey,
        })
      }

      // 3. Clear draft and trigger context refresh
      clearDraft()
      triggerRefresh()
      addToast('Reservation successfully confirmed!', 'success')

      // Navigate to success page
      navigate(`/booking/${createdRes._id}/success`)
    } catch (err) {
      console.error('Booking submission failed:', err)
      const msg = err.response?.data?.message || err.message || 'Booking submission failed. Please try again.'
      addToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div className="skeleton" style={{ height: 32, width: '40%', margin: '0 auto 20px' }} />
        <div className="skeleton" style={{ height: 200, width: '100%', borderRadius: 16 }} />
      </div>
    )
  }

  const photo =
    roomType?.images?.[0] ||
    roomType?.image ||
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', paddingBottom: 80 }}>
      {/* ── Top Header with Stepper ────────────────────────────────────────── */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '14px 24px',
          position: 'sticky',
          top: 64,
          zIndex: 40,
        }}
      >
        <div
          className="page-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) {
                setShowExitModal(true)
              } else {
                navigate(-1)
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back
          </button>

          {/* Stepper Pill */}
          <Stepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />

          <div style={{ width: 60 }} />
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <BackConfirmModal
        isOpen={showExitModal}
        onStay={() => setShowExitModal(false)}
        onGoBack={() => {
          setShowExitModal(false)
          navigate(-1)
        }}
      />

      <div className="page-container" style={{ marginTop: 28 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* ── Left Column: Active Step Content ─────────────────────────────── */}
          <div>
            {/* ── STEP 1: DETAILS ────────────────────────────────────────────── */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Stay Review Card */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #E5E7EB',
                    padding: '24px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: 16 }}>
                    1. Review Stay Details
                  </h2>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 16,
                      background: '#F9FAFB',
                      padding: '16px',
                      borderRadius: 12,
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Check-in</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                        {formatLongDate(checkIn)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>From 14:00 IST</span>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Check-out</span>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                        {formatLongDate(checkOut)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Until 11:00 IST</span>
                    </div>
                  </div>

                  {/* Room Category Card */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      borderBottom: '1px solid #F3F4F6',
                      paddingBottom: 20,
                      marginBottom: 20,
                    }}
                  >
                    <img
                      src={photo}
                      alt={roomType?.name}
                      style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 8 }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111827' }}>
                        {roomType?.name}
                      </h3>
                      <div style={{ fontSize: '0.8125rem', color: '#4B5563', marginTop: 2 }}>
                        {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'} · {adults} Adults · {roomType?.bedType}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600, marginTop: 4 }}>
                        ✓ Free Cancellation up to 48 hours before check-in
                      </div>
                    </div>
                  </div>

                  {/* Rate Plan Selector */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', marginBottom: 10 }}>
                      Selected Rate Plan
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setRatePlan('room_only')}
                        style={{
                          flex: 1,
                          padding: '14px',
                          borderRadius: 10,
                          border: `2px solid ${ratePlan === 'room_only' ? 'var(--color-primary)' : '#E5E7EB'}`,
                          background: ratePlan === 'room_only' ? '#FFF5F5' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>Room Only</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Accommodations &amp; Wi-Fi</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRatePlan('with_breakfast')}
                        style={{
                          flex: 1,
                          padding: '14px',
                          borderRadius: 10,
                          border: `2px solid ${ratePlan === 'with_breakfast' ? 'var(--color-primary)' : '#E5E7EB'}`,
                          background: ratePlan === 'with_breakfast' ? '#FFF5F5' : '#FFFFFF',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                          With Gourmet Breakfast
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Daily coastal buffet breakfast</div>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToTravellerInfo}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      borderRadius: 9999,
                      fontWeight: 700,
                      fontSize: '1rem',
                      background: 'var(--color-primary)',
                    }}
                  >
                    Continue to Traveller Info →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: TRAVELLER INFO ─────────────────────────────────────── */}
            {currentStep === 2 && (
              <form
                onSubmit={handleProceedToPayment}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E5E7EB',
                  padding: '24px 28px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: 20 }}>
                  2. Primary Guest Details
                </h2>

                {/* Booking for Myself vs Someone Else */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                    Who are you booking this stay for?
                  </label>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="radio"
                        name="bookingFor"
                        value="myself"
                        checked={bookingFor === 'myself'}
                        onChange={() => {
                          setBookingFor('myself')
                          setFullName(user?.name || '')
                        }}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span>I am booking for myself</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="radio"
                        name="bookingFor"
                        value="other"
                        checked={bookingFor === 'other'}
                        onChange={() => {
                          setBookingFor('other')
                          setFullName('')
                        }}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span>I am booking for someone else</span>
                    </label>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Full Name (as per Govt ID) <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    style={{
                      width: '100%',
                      borderColor: formErrors.fullName ? 'var(--color-error)' : undefined,
                    }}
                  />
                  {formErrors.fullName && (
                    <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: 4 }}>
                      {formErrors.fullName}
                    </div>
                  )}
                </div>

                {/* Email Address */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Email Address (confirmation voucher sent here) <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      borderColor: formErrors.email ? 'var(--color-error)' : undefined,
                    }}
                  />
                  {formErrors.email && (
                    <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: 4 }}>
                      {formErrors.email}
                    </div>
                  )}
                </div>

                {/* Mobile Phone Number */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Mobile Number <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#F3F4F6',
                        border: '1px solid #D1D5DB',
                        borderRadius: 8,
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: '#374151',
                      }}
                    >
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      maxLength={10}
                      style={{
                        flex: 1,
                        borderColor: formErrors.phone ? 'var(--color-error)' : undefined,
                      }}
                    />
                  </div>
                  {formErrors.phone && (
                    <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: 4 }}>
                      {formErrors.phone}
                    </div>
                  )}
                </div>

                {/* Estimated Arrival Window */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Expected Arrival Window
                  </label>
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="14:00 – 16:00">14:00 – 16:00 (Standard Check-in)</option>
                    <option value="16:00 – 18:00">16:00 – 18:00</option>
                    <option value="18:00 – 20:00">18:00 – 20:00</option>
                    <option value="Late Arrival after 20:00">Late Arrival (after 20:00)</option>
                  </select>
                </div>

                {/* Special Requests */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Special Requests (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. Quiet room away from elevator, extra pillows, early check-in request"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-secondary"
                    style={{ flex: 1, borderRadius: 9999 }}
                  >
                    ← Back to Details
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      flex: 2,
                      borderRadius: 9999,
                      fontWeight: 700,
                      background: 'var(--color-primary)',
                    }}
                  >
                    Continue to Payment →
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3: PAY ────────────────────────────────────────────────── */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Trust Badges Strip (Attachment #4) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    padding: '12px 16px',
                    fontSize: '0.8125rem',
                    color: '#374151',
                    fontWeight: 500,
                  }}
                >
                  <span>🔒 100% Secure Checkout</span>
                  <span>⚡ Instant Confirmation</span>
                  <span>🏨 Hotel Direct Booking</span>
                </div>

                {/* Coupon Code Strip */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #E5E7EB',
                    padding: '20px 24px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', marginBottom: 12 }}>
                    Have a Coupon or Promo Code?
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME10, STAY500"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      style={{ flex: 1, textTransform: 'uppercase' }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="btn-secondary"
                      style={{ borderRadius: 8, padding: '8px 16px', fontWeight: 700 }}
                    >
                      Apply
                    </button>
                  </div>

                  {quote?.coupon && (
                    <div
                      style={{
                        marginTop: 10,
                        color: 'var(--color-discount-green)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                      }}
                    >
                      ✓ {quote.couponMessage}
                    </div>
                  )}
                </div>

                {/* Settlement Options (Full / Deposit / At Hotel) */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #E5E7EB',
                    padding: '20px 24px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', marginBottom: 12 }}>
                    Select Payment Schedule
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `1.5px solid ${paymentChoice === 'full' ? 'var(--color-primary)' : '#E5E7EB'}`,
                        background: paymentChoice === 'full' ? '#FFF5F5' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="paymentChoice"
                          value="full"
                          checked={paymentChoice === 'full'}
                          onChange={() => setPaymentChoice('full')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                            Full Settlement Online
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>
                            Express check-in upon arrival at the hotel
                          </span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#111827' }}>
                        {formatINR(quote?.totalPayable || 0)}
                      </span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `1.5px solid ${paymentChoice === 'deposit' ? 'var(--color-primary)' : '#E5E7EB'}`,
                        background: paymentChoice === 'deposit' ? '#FFF5F5' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="paymentChoice"
                          value="deposit"
                          checked={paymentChoice === 'deposit'}
                          onChange={() => setPaymentChoice('deposit')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                            Pay 25% Deposit Now
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>
                            Remaining balance payable at reception desk
                          </span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#111827' }}>
                        {formatINR(quote?.depositAmount || Math.round((quote?.totalPayable || 0) * 0.25))}
                      </span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `1.5px solid ${paymentChoice === 'hotel' ? 'var(--color-primary)' : '#E5E7EB'}`,
                        background: paymentChoice === 'hotel' ? '#FFF5F5' : '#FFFFFF',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="radio"
                          name="paymentChoice"
                          value="hotel"
                          checked={paymentChoice === 'hotel'}
                          onChange={() => setPaymentChoice('hotel')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                            Pay at Hotel on Arrival
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>
                            ₹0.00 online now; settle via Cash, Card, or UPI during check-in
                          </span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: '#111827' }}>₹0.00</span>
                    </label>
                  </div>
                </div>

                {/* Online Payment Method Accordion (UPI, Card, Netbanking) */}
                {paymentChoice !== 'hotel' && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      padding: '24px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', marginBottom: 16 }}>
                      Select Payment Method
                    </div>

                    {/* Method 1: UPI QR */}
                    <div
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        marginBottom: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        onClick={() => setPaymentMethod('upi')}
                        style={{
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: paymentMethod === 'upi' ? '#F9FAFB' : '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: '1.25rem' }}>📱</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                            UPI QR Code (Google Pay, PhonePe, Paytm)
                          </span>
                        </div>
                        <input
                          type="radio"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </div>

                      {paymentMethod === 'upi' && (
                        <div
                          style={{
                            padding: '20px',
                            borderTop: '1px solid #F3F4F6',
                            textAlign: 'center',
                            background: '#FAFBFD',
                          }}
                        >
                          <div
                            style={{
                              width: 160,
                              height: 160,
                              margin: '0 auto 12px',
                              background: '#FFFFFF',
                              border: '1px solid #D1D5DB',
                              borderRadius: 12,
                              padding: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=harbourrow@demo&pn=HarbourRowHotel"
                              alt="Demo UPI QR"
                              style={{ width: 140, height: 140 }}
                            />
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: '#4B5563', marginBottom: 8 }}>
                            Scan with any UPI app to simulate demo payment
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUpiQrScanned(true)
                              addToast('Simulated UPI QR payment authorization confirmed!', 'success')
                            }}
                            style={{
                              background: upiQrScanned ? 'var(--color-success-bg)' : '#F3F4F6',
                              border: `1px solid ${upiQrScanned ? 'var(--color-success)' : '#D1D5DB'}`,
                              color: upiQrScanned ? 'var(--color-success)' : '#374151',
                              padding: '6px 14px',
                              borderRadius: 20,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {upiQrScanned ? '✓ UPI App Authorized' : 'Simulate QR Scan'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Method 2: Card */}
                    <div
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        marginBottom: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        onClick={() => setPaymentMethod('card')}
                        style={{
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: paymentMethod === 'card' ? '#F9FAFB' : '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: '1.25rem' }}>💳</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                            Credit or Debit Card (VISA, MasterCard, RuPay)
                          </span>
                        </div>
                        <input
                          type="radio"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </div>

                      {paymentMethod === 'card' && (
                        <div style={{ padding: '20px', borderTop: '1px solid #F3F4F6', background: '#FAFBFD' }}>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>
                              Card Number (Demo)
                            </label>
                            <input
                              type="text"
                              defaultValue="4111 2222 3333 4444"
                              readOnly
                              style={{ width: '100%', background: '#F3F4F6' }}
                            />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>
                                Expiry (MM/YY)
                              </label>
                              <input
                                type="text"
                                defaultValue="12/28"
                                readOnly
                                style={{ width: '100%', background: '#F3F4F6' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>
                                CVV (Simulated)
                              </label>
                              <input
                                type="password"
                                defaultValue="***"
                                readOnly
                                style={{ width: '100%', background: '#F3F4F6' }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Method 3: Netbanking */}
                    <div
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 12,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        onClick={() => setPaymentMethod('netbanking')}
                        style={{
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          background: paymentMethod === 'netbanking' ? '#F9FAFB' : '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: '1.25rem' }}>🏦</span>
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                            Netbanking (All Indian Banks)
                          </span>
                        </div>
                        <input
                          type="radio"
                          checked={paymentMethod === 'netbanking'}
                          onChange={() => setPaymentMethod('netbanking')}
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                      </div>

                      {paymentMethod === 'netbanking' && (
                        <div style={{ padding: '20px', borderTop: '1px solid #F3F4F6', background: '#FAFBFD' }}>
                          <select style={{ width: '100%' }}>
                            <option value="HDFC">HDFC Bank</option>
                            <option value="SBI">State Bank of India</option>
                            <option value="ICICI">ICICI Bank</option>
                            <option value="AXIS">Axis Bank</option>
                            <option value="KOTAK">Kotak Mahindra Bank</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Confirmation Button */}
                <button
                  type="button"
                  disabled={isSubmitting || quoteLoading}
                  onClick={handleConfirmBooking}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '16px 0',
                    borderRadius: 9999,
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    background: 'var(--color-primary)',
                    boxShadow: '0 4px 14px rgba(214, 57, 65, 0.4)',
                  }}
                >
                  {isSubmitting ? 'Confirming Stay...' : `Confirm Booking & Settle (${paymentChoice === 'hotel' ? 'Pay at Hotel' : formatINR(paymentChoice === 'deposit' ? quote?.depositAmount || 0 : quote?.totalPayable || 0)})`}
                </button>
              </div>
            )}
          </div>

          {/* ── Right Column: Sticky Reservation & Fare Summary ─────────────── */}
          <div
            style={{
              position: 'sticky',
              top: 136,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Top Snapshot Card matching reference Attachment #4 */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <img
                  src={photo}
                  alt={roomType?.name}
                  style={{ width: 68, height: 68, borderRadius: 8, objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: '#111827', lineHeight: 1.2 }}>
                    {HOTEL_CONFIG.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>
                    {HOTEL_CONFIG.area}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 600, marginTop: 4 }}>
                    {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'} · {adults} Adults
                  </div>
                </div>
              </div>

              {/* Dates Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: 8,
                  alignItems: 'center',
                  background: '#F9FAFB',
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: '0.8125rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>Check-in</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{formatShortDate(checkIn)}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>12:00 PM</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>Check-out</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{formatShortDate(checkOut)}</span>
                  <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>11:00 AM</span>
                </div>
              </div>

              {/* Category & Meal Plan */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                  {roomType?.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                  {ratePlan === 'with_breakfast' ? 'With Breakfast' : 'Room Only'}
                </div>
              </div>

              {/* Guest summary if at Step 2 or 3 */}
              {fullName && (
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Booking for</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                    {fullName}
                  </div>
                  {email && (
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>
                      Confirmation to: {email}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fare Breakup */}
            <FareBreakup
              quote={quote}
              nights={nights}
              rooms={roomsCount}
              selectedPaymentType={paymentChoice}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
