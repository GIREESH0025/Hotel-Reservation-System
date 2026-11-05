import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { roomTypesApi } from '../api/roomTypes.api'
import { reservationsApi } from '../api/reservations.api'
import { useBooking } from '../context/BookingContext'
import { useTitle } from '../hooks/useTitle'
import { HOTEL_CONFIG } from '../config/hotel.config'
import ImageGallery from '../components/ui/ImageGallery'
import FareBreakup from '../components/ui/FareBreakup'
import { MapPinIcon, MaximizeIcon, BedIcon, UsersIcon, CheckIcon } from '../components/ui/Icons'
import { formatINR, formatShortDate, todayStr, daysFromTodayStr, computeNights } from '../utils/helpers'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'rate-plans', label: 'Rate Plans' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'policies', label: 'Policies' },
  { id: 'location', label: 'Location' },
]

export default function RoomTypeDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateDraft } = useBooking()

  // Stay parameters from URL query string
  const checkIn = searchParams.get('checkIn') || todayStr()
  const checkOut = searchParams.get('checkOut') || daysFromTodayStr(2)
  const roomsCount = Math.max(1, parseInt(searchParams.get('rooms'), 10) || 1)
  const adults = Math.max(1, parseInt(searchParams.get('adults'), 10) || 2)
  let parsedChildren = []
  try {
    const rawCh = searchParams.get('children')
    if (rawCh) parsedChildren = JSON.parse(rawCh)
  } catch {
    parsedChildren = []
  }

  const nights = computeNights(checkIn, checkOut)

  const [roomType, setRoomType] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRatePlan, setSelectedRatePlan] = useState('room_only') // 'room_only' | 'with_breakfast'
  const [activeTab, setActiveTab] = useState('overview')
  const [quote, setQuote] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  useTitle(roomType ? `${roomType.name} — Harbour Row Hotel` : 'Room Details')

  // Load Room Type Details
  useEffect(() => {
    async function loadRoomType() {
      try {
        setLoading(true)
        const res = await roomTypesApi.get(id)
        setRoomType(res.data?.data || null)
      } catch (err) {
        console.error('Failed to load room type:', err)
      } finally {
        setLoading(false)
      }
    }
    loadRoomType()
  }, [id])

  // Fetch Live Server Quote whenever dates, rooms, adults, children, or ratePlan changes
  useEffect(() => {
    if (!roomType) return
    async function fetchQuote() {
      try {
        setQuoteLoading(true)
        const res = await reservationsApi.quote({
          roomTypeId: roomType._id,
          checkIn,
          checkOut,
          rooms: roomsCount,
          adults,
          children: parsedChildren,
          ratePlan: selectedRatePlan,
        })
        if (res.data?.data) {
          setQuote(res.data.data)
          return
        }
      } catch (err) {
        console.warn('Failed to compute live quote from server, falling back to local calculation:', err)
      } finally {
        setQuoteLoading(false)
      }

      // Safe fallback calculation so user is never blocked by skeletons
      const n = Math.max(1, computeNights(checkIn, checkOut))
      const baseRate = roomType.baseRate || 2800
      const baseFare = baseRate * n * roomsCount
      const breakfastPrice = roomType.breakfastPricePerAdult || 450
      const breakfastAmount = selectedRatePlan === 'with_breakfast' ? breakfastPrice * adults * n : 0
      const subtotal = baseFare + breakfastAmount
      const taxRate = subtotal / (n * roomsCount) >= 7500 ? 0.18 : 0.12
      const taxAmount = Math.round(subtotal * taxRate)
      const totalAmount = subtotal + taxAmount
      const depositAmount = Math.round(totalAmount * 0.25)

      setQuote({
        isValid: true,
        roomTypeId: roomType._id,
        roomTypeName: roomType.name,
        checkIn,
        checkOut,
        nights: n,
        rooms: roomsCount,
        adults,
        children: parsedChildren,
        ratePlan: selectedRatePlan,
        perNightRate: baseRate,
        baseFare,
        breakfastAmount,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        totalPayable: totalAmount,
        depositAmount,
        breakdown: {
          baseFare,
          breakfastAmount,
          taxAmount,
          taxRate: Math.round(taxRate * 100),
          discountAmount: 0,
          totalAmount,
          depositAmount,
          depositPercent: 25,
          balanceDue: totalAmount - depositAmount,
        },
      })
    }
    fetchQuote()
  }, [roomType, checkIn, checkOut, roomsCount, adults, parsedChildren.length, selectedRatePlan])

  // Scroll-spy tracking ref to avoid jank when clicking tab buttons
  const isClickingTabRef = useRef(false)

  const scrollToSection = (tabId) => {
    setActiveTab(tabId)
    isClickingTabRef.current = true
    const el = document.getElementById(tabId)
    if (el) {
      const topOffset = 136 // 64px sticky navbar + 56px sticky tab bar + 16px buffer
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - topOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
      setTimeout(() => {
        isClickingTabRef.current = false
      }, 700)
    }
  }

  // Scroll-spy: dynamically updates activeTab as user scrolls through sections
  useEffect(() => {
    if (loading || !roomType) return

    const handleScroll = () => {
      if (isClickingTabRef.current) return

      const scrollPos = window.scrollY + 150
      const windowBottom = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      // If scrolled near bottom of page, highlight last tab ('location')
      if (windowBottom >= docHeight - 80) {
        setActiveTab('location')
        return
      }

      const sectionIds = ['overview', 'rate-plans', 'facilities', 'policies', 'location']
      let currentSection = 'overview'

      for (const sId of sectionIds) {
        const el = document.getElementById(sId)
        if (el) {
          const top = el.offsetTop
          if (scrollPos >= top) {
            currentSection = sId
          }
        }
      }

      setActiveTab(currentSection)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [loading, roomType])

  const handleContinueToBook = () => {
    if (!roomType) return

    // Build the draft
    const draft = {
      roomTypeId: roomType._id,
      roomTypeName: roomType.name,
      checkIn,
      checkOut,
      rooms: roomsCount,
      adults,
      children: parsedChildren,
      ratePlan: selectedRatePlan,
      quote,
    }

    if (updateDraft) {
      updateDraft(draft)
    }
    try {
      sessionStorage.setItem('hrh_booking_draft', JSON.stringify(draft))
      sessionStorage.setItem('booking_draft', JSON.stringify(draft))
    } catch {
      // Storage fallback
    }

    const params = new URLSearchParams({
      roomTypeId: roomType._id,
      checkIn,
      checkOut,
      rooms: roomsCount.toString(),
      adults: adults.toString(),
      ratePlan: selectedRatePlan,
    })
    navigate(`/book?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '48px 24px' }}>
        <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 360, width: '100%', borderRadius: 16, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 24, width: '60%' }} />
      </div>
    )
  }

  if (!roomType) {
    return (
      <div className="page-container" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Room category not found</h2>
        <Link to="/search" className="btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
          Back to Search Results
        </Link>
      </div>
    )
  }

  const photos =
    roomType.images && roomType.images.length > 0
      ? roomType.images
      : [roomType.image || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', paddingBottom: 80 }}>
      {/* ── Top Navigation & Back Link ───────────────────────────────────────── */}
      <div
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '12px 24px',
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
          <Link
            to={`/search?${searchParams.toString()}`}
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back to results
          </Link>

          <div style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
            {formatShortDate(checkIn)} – {formatShortDate(checkOut)} ({nights} {nights === 1 ? 'Night' : 'Nights'}) · {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'} · {adults} Adults
          </div>
        </div>
      </div>

      <div className="page-container" style={{ marginTop: 24 }}>
        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: 6 }}>
            {roomType.name}
          </h1>

          <div style={{ fontSize: '0.875rem', color: '#4B5563', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MapPinIcon size={14} color="#6B7280" /> {HOTEL_CONFIG.area}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <MaximizeIcon size={14} color="#6B7280" /> {roomType.size ? `${roomType.size} sq m` : '38 sq m'}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <BedIcon size={14} color="#6B7280" /> {roomType.bedType || 'King Bed'}
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <UsersIcon size={14} color="#6B7280" /> Up to {roomType.maxOccupancy || roomType.capacity || 2} Guests
            </span>
          </div>
        </div>

        {/* ── 5-Photo Mosaic Gallery with Lightbox Modal ──────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <ImageGallery images={photos} alt={roomType.name} />
        </div>

        {/* ── Sticky Tab Bar with Scroll-Spy Navigation (Attachment #4) ──────── */}
        <div
          style={{
            position: 'sticky',
            top: 64,
            zIndex: 35,
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            borderRadius: 12,
            marginBottom: 24,
            display: 'flex',
            padding: '0 16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          }}
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '16px 20px',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.9375rem',
                  color: isSelected ? 'var(--color-primary)' : '#4B5563',
                  borderBottom: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Two-Column Main Layout: Details & Sticky Quote Card ────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 360px',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* 1. Overview */}
            <section
              id="overview"
              style={{
                scrollMarginTop: 136,
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                About {roomType.name}
              </h2>
              <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.6, marginBottom: 20 }}>
                {roomType.description}
              </p>

              {/* Highlights Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(roomType.highlights || roomType.amenities || []).map((hl, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: '#F3F4F6',
                      color: '#1F2937',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: 20,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckIcon size={12} color="var(--color-primary)" /> {hl}
                    </span>
                  </span>
                ))}
              </div>
            </section>

            {/* 2. Rate Plans (Room Only vs With Breakfast) */}
            <section
              id="rate-plans"
              style={{
                scrollMarginTop: 136,
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                Choose Your Rate Plan
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: 20 }}>
                Select between room-only flexibility or chef-curated coastal breakfast inclusive tariff.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Plan A: Room Only */}
                <div
                  onClick={() => setSelectedRatePlan('room_only')}
                  style={{
                    border: `2px solid ${selectedRatePlan === 'room_only' ? 'var(--color-primary)' : '#E5E7EB'}`,
                    background: selectedRatePlan === 'room_only' ? '#FFF5F5' : '#FFFFFF',
                    borderRadius: 12,
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${selectedRatePlan === 'room_only' ? 'var(--color-primary)' : '#9CA3AF'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedRatePlan === 'room_only' && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
                        )}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                        Room Only Plan
                      </span>
                    </div>
                    <ul style={{ paddingLeft: 26, fontSize: '0.8125rem', color: '#4B5563', lineHeight: 1.5 }}>
                      <li>Accommodations in {roomType.name}</li>
                      <li>Complimentary high-speed Wi-Fi and tea/coffee bar</li>
                      <li>Free cancellation up to 48 hours prior to arrival</li>
                    </ul>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                      {formatINR(roomType.baseRate)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>per night / room</div>
                  </div>
                </div>

                {/* Plan B: With Breakfast */}
                <div
                  onClick={() => setSelectedRatePlan('with_breakfast')}
                  style={{
                    border: `2px solid ${selectedRatePlan === 'with_breakfast' ? 'var(--color-primary)' : '#E5E7EB'}`,
                    background: selectedRatePlan === 'with_breakfast' ? '#FFF5F5' : '#FFFFFF',
                    borderRadius: 12,
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: `2px solid ${selectedRatePlan === 'with_breakfast' ? 'var(--color-primary)' : '#9CA3AF'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {selectedRatePlan === 'with_breakfast' && (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
                        )}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                        With Gourmet Breakfast
                      </span>
                      <span
                        style={{
                          background: '#ECFDF5',
                          color: '#059669',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        BEST VALUE
                      </span>
                    </div>
                    <ul style={{ paddingLeft: 26, fontSize: '0.8125rem', color: '#4B5563', lineHeight: 1.5 }}>
                      <li>Daily buffet breakfast for {adults} {adults === 1 ? 'adult' : 'adults'} in the dining hall</li>
                      <li>Accommodations in {roomType.name}</li>
                      <li>Free cancellation up to 48 hours prior to arrival</li>
                    </ul>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                      {formatINR(roomType.baseRate + (roomType.breakfastPricePerAdult || 450) * Math.min(adults, 2))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>per night (incl. breakfast)</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Facilities */}
            <section
              id="facilities"
              style={{
                scrollMarginTop: 136,
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                Chamber Facilities &amp; Inclusions
              </h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16,
                }}
              >
                {(roomType.amenities || ['Wi-Fi', 'Air Conditioning', 'En-suite Bath', 'In-room Safe']).map((am, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: '#374151' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>✓</span>
                    <span>{am}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. Policies */}
            <section
              id="policies"
              style={{
                scrollMarginTop: 136,
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 16 }}>
                Policies &amp; Stay Rules
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.875rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    Arrival and Departure
                  </div>
                  <div style={{ color: '#4B5563' }}>
                    Check-in starts at 14:00 IST. Check-out is by 11:00 IST. Early arrivals and late departures are accommodated upon request subject to availability.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    Free Cancellation Guarantee
                  </div>
                  <div style={{ color: '#4B5563' }}>
                    Cancel free of charge up to 48 hours before arrival date. Any pre-paid deposit will be fully refunded to your original payment method.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                  <div style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    Child &amp; Extra Bed Policy
                  </div>
                  <div style={{ color: '#4B5563' }}>
                    Children up to 5 years stay free when sharing existing bedding. Children aged 6–17 years are charged standard tariff.
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Location */}
            <section
              id="location"
              style={{
                scrollMarginTop: 136,
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                padding: '24px 28px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                Location &amp; Surrounds
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: 12 }}>
                {HOTEL_CONFIG.address.street}, {HOTEL_CONFIG.address.city}, {HOTEL_CONFIG.address.state} {HOTEL_CONFIG.address.postalCode}
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                Conveniently situated in Mumbai's historic heritage precinct, 200m from Gateway of India, with immediate access to ferry terminals and boutique art galleries.
              </p>
            </section>
          </div>

          {/* Right Column: Sticky Fare Summary Card */}
          <div
            style={{
              position: 'sticky',
              top: 136,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Stay Summary Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', marginBottom: 12 }}>
                Stay Reservation Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Check-in:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{formatShortDate(checkIn)} (14:00)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Check-out:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{formatShortDate(checkOut)} (11:00)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Duration:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Rooms &amp; Guests:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {roomsCount} {roomsCount === 1 ? 'Room' : 'Rooms'} · {adults} Adults
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                  <span>Meal Plan:</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    {selectedRatePlan === 'with_breakfast' ? 'Breakfast Included' : 'Room Only'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Server Fare Breakup Card */}
            <FareBreakup
              quote={quote}
              nights={nights}
              rooms={roomsCount}
              selectedPaymentType="full"
            />

            {/* CTA Button */}
            <button
              type="button"
              disabled={!roomType}
              onClick={handleContinueToBook}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 0',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 9999,
                background: 'var(--color-primary)',
                boxShadow: '0 4px 14px rgba(214, 57, 65, 0.35)',
                cursor: !roomType ? 'not-allowed' : 'pointer',
              }}
            >
              {quoteLoading && !quote ? 'Calculating Fare...' : 'Continue to Book →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

