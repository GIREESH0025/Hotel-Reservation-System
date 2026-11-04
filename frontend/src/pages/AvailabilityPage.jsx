import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomsApi } from '../api/rooms.api'
import { roomTypesApi } from '../api/roomTypes.api'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useTitle } from '../hooks/useTitle'
import { HOTEL_CONFIG } from '../config/hotel.config'
import { formatINR, todayStr, daysFromTodayStr, computeNights, formatDate, formatDateEditorial } from '../utils/helpers'

export default function AvailabilityPage() {
  useTitle('Room Availability & Booking')
  const [checkIn, setCheckIn] = useState(todayStr())
  const [checkOut, setCheckOut] = useState(daysFromTodayStr(2))
  const [adults, setAdults] = useState(2)
  const [errors, setErrors] = useState({})

  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [fetchError, setFetchError] = useState(null)

  // Room types catalog for gallery and hero image
  const [allRoomTypes, setAllRoomTypes] = useState([])
  const [expandedFaq, setExpandedFaq] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const res = await roomTypesApi.list({ limit: 10 })
        const types = res.data?.data || []
        setAllRoomTypes(types)
      } catch {
        // Fallback gracefully
      }
    }
    loadCatalog()
  }, [])

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    setFetchError(null)

    // Client-side validation
    const errs = {}
    if (!checkIn) errs.checkIn = 'Check-in date is required'
    if (!checkOut) errs.checkOut = 'Check-out date is required'
    if (checkIn && checkOut && checkOut <= checkIn) {
      errs.checkOut = 'Check-out must be after check-in'
    }
    const nightsCount = computeNights(checkIn, checkOut)
    if (nightsCount > 30) {
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
      setSearched(true)
      const res = await roomsApi.availability({ checkIn, checkOut, adults })
      setResults(res.data?.data || [])
      const resultsEl = document.getElementById('search-results-anchor')
      if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to search room availability.')
    } finally {
      setLoading(false)
    }
  }

  const handleBook = (roomTypeItem) => {
    const firstRoom = roomTypeItem.rooms[0]
    navigate(
      `/book?roomId=${firstRoom._id}&roomTypeId=${roomTypeItem.roomType._id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&rate=${roomTypeItem.rate}`
    )
  }

  const nights = computeNights(checkIn, checkOut)
  const heroImageSrc = allRoomTypes[0]?.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'
  const heroRoomName = allRoomTypes[0]?.name || 'Deluxe Room'
  const heroRoomRate = allRoomTypes[0]?.baseRate || 2500

  return (
    <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '32px var(--content-pad)' }}>
      {/* ── Editorial Two-Column 7/5 Hero ── */}
      <section style={{ marginBottom: '56px' }}>
        <div className="hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '7fr 5fr',
          gap: '40px',
          alignItems: 'stretch',
        }}>
          {/* Left Column: Heading, Subtitle & Bottom-docked Booking Slip */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-laterite)',
                fontWeight: 600,
                marginBottom: '8px',
              }}>
                {HOTEL_CONFIG.name} &bull; {HOTEL_CONFIG.area}
              </span>

              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
                lineHeight: 1.1,
                color: 'var(--color-ink)',
                margin: '0 0 16px 0',
                letterSpacing: '-0.02em',
              }}>
                Stay at Harbour Row.
              </h1>

              <p style={{
                fontSize: '1.0625rem',
                color: 'var(--color-stone)',
                lineHeight: 1.5,
                margin: '0 0 28px 0',
                maxWidth: '520px',
              }}>
                Choose your dates to see which rooms are free.
              </p>
            </div>

            {/* Bottom-Docked Booking Slip */}
            <div style={{
              border: '1px solid var(--color-ink)',
              padding: '24px',
              backgroundColor: '#fff',
              marginTop: 'auto',
              boxShadow: '3px 3px 0 var(--color-ink)',
            }}>
              <div style={{ borderBottom: '1px solid var(--color-rule)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--color-ink)' }}>
                  Reservation Slip
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)', fontVariantNumeric: 'tabular-nums' }}>
                  {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''} stay` : 'Select stay dates'}
                </span>
              </div>

              <form onSubmit={handleSearch} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', alignItems: 'flex-start' }}>
                  <Field
                    label="Arrival"
                    type="date"
                    value={checkIn}
                    min={todayStr()}
                    onChange={(e) => {
                      setCheckIn(e.target.value)
                      if (errors.checkIn) setErrors((prev) => ({ ...prev, checkIn: '' }))
                    }}
                    error={errors.checkIn}
                    helper={checkIn ? formatDateEditorial(checkIn) : ''}
                    required
                  />

                  <Field
                    label="Departure"
                    type="date"
                    value={checkOut}
                    min={checkIn || todayStr()}
                    onChange={(e) => {
                      setCheckOut(e.target.value)
                      if (errors.checkOut) setErrors((prev) => ({ ...prev, checkOut: '' }))
                    }}
                    error={errors.checkOut}
                    helper={checkOut ? formatDateEditorial(checkOut) : ''}
                    required
                  />

                  <Field
                    label="Guests"
                    type="number"
                    min="1"
                    max="10"
                    value={adults}
                    onChange={(e) => {
                      setAdults(parseInt(e.target.value, 10) || 1)
                      if (errors.adults) setErrors((prev) => ({ ...prev, adults: '' }))
                    }}
                    error={errors.adults}
                    helper={`${adults} adult${adults > 1 ? 's' : ''}`}
                    required
                  />
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', height: '44px', fontWeight: 600 }}>
                    Find Available Rooms &rarr;
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Tall 4:5 Room Photo in Ink Offset Frame */}
          <div className="hero-photo-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              border: '1px solid var(--color-ink)',
              padding: '6px',
              backgroundColor: '#fff',
              boxShadow: '4px 4px 0 var(--color-ink)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                flex: 1,
                minHeight: '380px',
                overflow: 'hidden',
                backgroundColor: 'var(--color-rule)',
              }}>
                <img
                  src={heroImageSrc}
                  alt={`${heroRoomName} at ${HOTEL_CONFIG.name}`}
                  width="480"
                  height="600"
                  fetchPriority="high"
                  loading="eager"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
              <div style={{
                padding: '10px 4px 4px 4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: '0.8125rem',
                borderTop: '1px solid var(--color-rule)',
                marginTop: '6px',
              }}>
                <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{heroRoomName}</span>
                <span style={{ color: 'var(--color-stone)', fontVariantNumeric: 'tabular-nums' }}>
                  from {formatINR(heroRoomRate)} per night
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anchor for search results */}
      <div id="search-results-anchor" />

      {/* ── Search Results Section ── */}
      {loading && (
        <div style={{ marginBottom: '48px' }}>
          <Skeleton height="32px" style={{ width: '280px', marginBottom: '20px' }} />
          <Skeleton height="180px" style={{ marginBottom: '16px' }} />
          <Skeleton height="180px" />
        </div>
      )}

      {fetchError && (
        <div style={{ marginBottom: '48px' }}>
          <ErrorState message={fetchError} onRetry={handleSearch} />
        </div>
      )}

      {!loading && searched && (
        <section style={{ marginBottom: '64px' }}>
          <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '12px', marginBottom: '24px' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
              Search Results
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: '2px' }}>
              Available Rooms ({results.length} Type{results.length !== 1 ? 's' : ''} Fit)
            </h2>
            <p style={{ color: 'var(--color-stone)', fontSize: '0.875rem', marginTop: '4px' }}>
              Dates: <strong>{formatDate(checkIn)}</strong> &rarr; <strong>{formatDate(checkOut)}</strong> ({nights} night{nights !== 1 ? 's' : ''}) &bull; {adults} guest{adults !== 1 ? 's' : ''}
            </p>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No Rooms Available"
              message={`All rooms accommodating ${adults} adult${adults > 1 ? 's' : ''} are reserved for the chosen dates. Please try different dates or check back soon.`}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {results.map((item) => {
                const rt = item.roomType
                const totalStayAmount = item.rate * nights
                const photo = rt.image || heroImageSrc

                return (
                  <div
                    key={rt._id}
                    style={{
                      border: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      backgroundColor: '#fff',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(240px, 320px) 1fr',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    }}
                    className="room-result-card"
                  >
                    {/* Room Image */}
                    <div style={{ position: 'relative', minHeight: '220px', backgroundColor: 'var(--color-rule)' }}>
                      <img
                        src={photo}
                        alt={rt.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                    </div>

                    {/* Room Particulars */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', margin: 0 }}>
                              {rt.name}
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '2px', display: 'block' }}>
                              Floor 1-4 &bull; Accommodates up to {rt.capacity} adults
                            </span>
                          </div>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            backgroundColor: 'var(--color-moss-bg)',
                            color: 'var(--color-moss)',
                            borderRadius: 'var(--radius)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            {item.availableCount} room{item.availableCount > 1 ? 's' : ''} available
                          </span>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', lineHeight: 1.5, margin: '8px 0 16px 0' }}>
                          {rt.description}
                        </p>

                        {/* Amenities */}
                        {rt.amenities && rt.amenities.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                            {rt.amenities.map((a) => (
                              <span
                                key={a}
                                style={{
                                  fontSize: '0.6875rem',
                                  padding: '2px 8px',
                                  border: '1px solid var(--color-rule)',
                                  borderRadius: 'var(--radius)',
                                  color: 'var(--color-stone)',
                                  backgroundColor: 'var(--color-paper)',
                                }}
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pricing & Booking Action */}
                      <div style={{
                        borderTop: '1px solid var(--color-rule)',
                        paddingTop: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}>
                        <div>
                          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', display: 'block' }}>
                            Nightly Rate
                          </span>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700 }}>
                            {formatINR(item.rate)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}> / night</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '2px' }}>
                            {formatINR(totalStayAmount)} total ({nights} nights)
                          </span>
                        </div>

                        <Button
                          variant="primary"
                          onClick={() => handleBook(item)}
                        >
                          Reserve Room &rarr;
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Room Types Visual Catalog ── */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Accommodations
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginTop: '2px' }}>
            Our Rooms &amp; Suites
          </h2>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.9375rem', marginTop: '4px', maxWidth: '700px' }}>
            Thoughtfully appointed rooms featuring natural timber furnishings, custom brass hardware, and dedicated workspaces.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {allRoomTypes.map((rt) => {
            const photo = rt.image || heroImageSrc
            return (
              <div
                key={rt._id}
                style={{
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {photo && (
                  <div style={{ height: '180px', overflow: 'hidden', backgroundColor: 'var(--color-slate)' }}>
                    <img
                      src={photo}
                      alt={rt.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                )}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 6px 0' }}>
                      {rt.name}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {rt.description}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.6875rem', padding: '2px 6px', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius)', color: 'var(--color-stone)' }}>
                        Capacity: {rt.capacity} Adults
                      </span>
                      {rt.amenities?.slice(0, 3).map((a) => (
                        <span key={a} style={{ fontSize: '0.6875rem', padding: '2px 6px', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius)', color: 'var(--color-stone)' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dotted var(--color-rule)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-stone)' }}>From</span>
                      <p style={{ margin: '2px 0 0 0', fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600 }}>
                        {formatINR(rt.baseRate)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-stone)' }}>/ night</span>
                      </p>
                    </div>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-laterite)',
                        fontWeight: 600,
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Check Dates &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Hotel Amenities & Services ── */}
      <section style={{ marginBottom: '64px', borderTop: '1px solid var(--color-rule)', paddingTop: '40px' }}>
        <div style={{ borderBottom: '1px solid var(--color-rule)', paddingBottom: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Property Offerings
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: '2px' }}>
            Services &amp; Amenities
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}>
          {HOTEL_CONFIG.amenities.map((item) => (
            <div
              key={item.name}
              style={{
                border: 'var(--border)',
                padding: '20px',
                borderRadius: 'var(--radius)',
                backgroundColor: '#fff',
              }}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.0625rem', marginBottom: '6px' }}>
                {item.name}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', lineHeight: 1.5, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stay Policies & FAQ ── */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '40px',
        marginBottom: '64px',
        borderTop: '1px solid var(--color-rule)',
        paddingTop: '40px',
      }}>
        {/* Policies */}
        <div>
          <div style={{ borderBottom: '1px solid var(--color-ink)', paddingBottom: '8px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
              Official Standards
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: '2px 0 0 0' }}>
              House Policies
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {HOTEL_CONFIG.policies.map((pol) => (
              <div key={pol.title} style={{ borderBottom: '1px dotted var(--color-rule)', paddingBottom: '12px' }}>
                <strong style={{ display: 'block', fontSize: '0.875rem', marginBottom: '4px' }}>
                  {pol.title}
                </strong>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', lineHeight: 1.5, margin: 0 }}>
                  {pol.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs Accordion */}
        <div>
          <div style={{ borderBottom: '1px solid var(--color-ink)', paddingBottom: '8px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
              Information
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: '2px 0 0 0' }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {HOTEL_CONFIG.faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div
                  key={faq.q}
                  style={{
                    border: 'var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: 'var(--color-ink)',
                    }}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: 'var(--color-laterite)', marginLeft: '12px', fontSize: '1.125rem' }}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 16px 14px 16px',
                      fontSize: '0.8125rem',
                      color: 'var(--color-stone)',
                      lineHeight: 1.55,
                      borderTop: '1px dotted var(--color-rule)',
                      paddingTop: '10px',
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Contact & Location Block ── */}
      <section style={{
        border: 'var(--border)',
        padding: '28px',
        backgroundColor: '#fff',
        borderRadius: 'var(--radius)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
      }}>
        <div>
          <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Colaba Location
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', margin: '4px 0 6px 0' }}>
            {HOTEL_CONFIG.address.street}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', margin: 0 }}>
            {HOTEL_CONFIG.address.city}, {HOTEL_CONFIG.address.state} {HOTEL_CONFIG.address.postalCode}, {HOTEL_CONFIG.address.country}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-stone)' }}>Reception Telephone</span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '0.9375rem' }}>{HOTEL_CONFIG.contact.reception}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-stone)' }}>Electronic Mail</span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '0.9375rem' }}>{HOTEL_CONFIG.contact.reservations}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
