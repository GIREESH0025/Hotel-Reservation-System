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
import { formatINR, todayStr, daysFromTodayStr, computeNights } from '../utils/helpers'

export default function AvailabilityPage() {
  useTitle('Chamber Availability & Lodgings')
  const [checkIn, setCheckIn] = useState(todayStr())
  const [checkOut, setCheckOut] = useState(daysFromTodayStr(2))
  const [adults, setAdults] = useState(2)
  const [errors, setErrors] = useState({})

  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [fetchError, setFetchError] = useState(null)

  // Room types catalog for gallery
  const [allRoomTypes, setAllRoomTypes] = useState([])
  const [expandedFaq, setExpandedFaq] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    // Fetch room types catalog for the public gallery
    const loadCatalog = async () => {
      try {
        const res = await roomTypesApi.list({ limit: 10 })
        setAllRoomTypes(res.data?.data || [])
      } catch {
        // Fallback gracefully if catalog load fails
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
    const nights = computeNights(checkIn, checkOut)
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
      setSearched(true)
      const res = await roomsApi.availability({ checkIn, checkOut, adults })
      setResults(res.data?.data || [])
      // Scroll smoothly to results
      const resultsEl = document.getElementById('search-results-anchor')
      if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      setFetchError(err.response?.data?.message || 'Failed to search room availability.')
    } finally {
      setLoading(false)
    }
  }

  const handleBook = (roomTypeItem) => {
    // Pick the first available room of this type
    const firstRoom = roomTypeItem.rooms[0]
    navigate(
      `/book?roomId=${firstRoom._id}&roomTypeId=${roomTypeItem.roomType._id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&rate=${roomTypeItem.rate}`
    )
  }

  const nights = computeNights(checkIn, checkOut)

  return (
    <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '32px var(--content-pad)' }}>
      {/* ── Editorial Hotel Hero ── */}
      <section style={{
        marginBottom: '40px',
        borderBottom: '2px solid var(--color-ink)',
        paddingBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-laterite)',
              fontWeight: 600,
              marginBottom: '6px',
            }}>
              Est. {HOTEL_CONFIG.established} &bull; Fort Waterfront, Mumbai
            </span>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              lineHeight: 1.15,
              color: 'var(--color-ink)',
              margin: '0 0 12px 0',
            }}>
              {HOTEL_CONFIG.tagline}
            </h1>
            <p style={{
              fontSize: '1.0625rem',
              color: 'var(--color-stone)',
              maxWidth: '720px',
              lineHeight: 1.6,
              margin: 0,
            }}>
              Welcoming discerning voyagers, maritime captains, and cultural pilgrims to Apollo Bunder for nearly a century. 
              Preserving classic architectural grace with modern comforts and seamless front-desk service.
            </p>
          </div>

          <div style={{
            border: 'var(--border)',
            padding: '16px 20px',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-paper)',
            textAlign: 'right',
            fontSize: '0.8125rem',
          }}>
            <strong style={{ display: 'block', color: 'var(--color-ink)', fontSize: '0.875rem' }}>Front Desk Register</strong>
            <span style={{ color: 'var(--color-stone)' }}>Check-in: {HOTEL_CONFIG.timings.checkIn}</span><br />
            <span style={{ color: 'var(--color-stone)' }}>Check-out: {HOTEL_CONFIG.timings.checkOut}</span><br />
            <span style={{ color: 'var(--color-moss)', fontWeight: 600 }}>&bull; Desk Attendant On Duty</span>
          </div>
        </div>
      </section>

      {/* ── Availability Search Register Box ── */}
      <section style={{
        border: 'var(--border)',
        padding: '28px',
        backgroundColor: 'var(--color-paper)',
        marginBottom: '48px',
        borderRadius: 'var(--radius)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <div style={{ borderBottom: '1px solid var(--color-rule)', paddingBottom: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Chamber Inquiries
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginTop: '2px' }}>
            Check Vacant Chambers
          </h2>
        </div>

        <form onSubmit={handleSearch} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
            <Field
              label="Arrival date"
              type="date"
              value={checkIn}
              min={todayStr()}
              onChange={(e) => {
                setCheckIn(e.target.value)
                if (errors.checkIn) setErrors((prev) => ({ ...prev, checkIn: '' }))
              }}
              error={errors.checkIn}
              required
            />

            <Field
              label="Departure date"
              type="date"
              value={checkOut}
              min={checkIn || todayStr()}
              onChange={(e) => {
                setCheckOut(e.target.value)
                if (errors.checkOut) setErrors((prev) => ({ ...prev, checkOut: '' }))
              }}
              error={errors.checkOut}
              required
            />

            <Field
              label="Occupants"
              type="number"
              min="1"
              max="10"
              value={adults}
              onChange={(e) => {
                setAdults(parseInt(e.target.value, 10) || 1)
                if (errors.adults) setErrors((prev) => ({ ...prev, adults: '' }))
              }}
              error={errors.adults}
              helper={`${nights} night${nights !== 1 ? 's' : ''} stay`}
              required
            />

            <div style={{ paddingTop: '24px' }}>
              <Button type="submit" variant="primary" loading={loading} style={{ width: '100%', height: '42px' }}>
                Check Availability &rarr;
              </Button>
            </div>
          </div>
        </form>
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

      {searched && !loading && !fetchError && (
        <section style={{ marginBottom: '64px' }}>
          <div style={{ borderBottom: '1px solid var(--color-ink)', paddingBottom: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: 0 }}>
              Available Chambers ({results.length} Types Fit)
            </h2>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
              For stay {checkIn} &rarr; {checkOut} ({nights} nights &bull; {adults} adult{adults > 1 ? 's' : ''})
            </span>
          </div>

          {results.length === 0 ? (
            <EmptyState
              title="No Chambers Available"
              message={`We regret that all chambers meeting your party size (${adults} adults) are occupied for the dates requested. Kindly try alternative dates or phone our concierge desk.`}
              actionLabel="Modify Dates"
              onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {results.map((item) => {
                const rt = item.roomType
                const photo = HOTEL_CONFIG.roomImages[rt.name]
                const totalStayAmount = item.rate * nights

                return (
                  <div
                    key={rt._id}
                    style={{
                      border: 'var(--border)',
                      borderRadius: 'var(--radius)',
                      backgroundColor: 'var(--color-paper)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      overflow: 'hidden',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    }}
                  >
                    {/* Room Photo or Typographic Plate */}
                    {photo ? (
                      <div style={{ position: 'relative', minHeight: '220px', backgroundColor: 'var(--color-slate)' }}>
                        <img
                          src={photo}
                          alt={rt.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          loading="lazy"
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '12px',
                          backgroundColor: 'rgba(28, 27, 24, 0.85)',
                          color: '#fff',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          borderRadius: 'var(--radius)',
                          fontWeight: 500,
                        }}>
                          {item.availableCount} Chamber{item.availableCount > 1 ? 's' : ''} Vacant
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        padding: '28px',
                        backgroundColor: 'var(--color-stone-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-ink)' }}>
                          {rt.name}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', marginTop: '4px' }}>
                          Historic Chamber &bull; Floor 1–4
                        </span>
                      </div>
                    )}

                    {/* Room Specs & Details */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', margin: 0 }}>
                            {rt.name}
                          </h3>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-moss)', padding: '2px 8px', backgroundColor: 'var(--color-moss-bg)', borderRadius: 'var(--radius)' }}>
                            {item.availableCount} Vacant
                          </span>
                        </div>

                        <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', lineHeight: 1.5, marginBottom: '16px' }}>
                          {rt.description}
                        </p>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius)', color: 'var(--color-stone)' }}>
                            Max {rt.capacity} Adults
                          </span>
                          {rt.amenities?.map((amenity) => (
                            <span key={amenity} style={{ fontSize: '0.75rem', padding: '2px 8px', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius)', color: 'var(--color-stone)' }}>
                              &bull; {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing and Action */}
                      <div style={{
                        borderTop: '1px dotted var(--color-rule)',
                        paddingTop: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}>
                        <div>
                          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)', display: 'block' }}>
                            Nightly Tariff
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
                          Reserve Chamber &rarr;
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

      {/* ── "Our Chambers" Visual Gallery ── */}
      <section style={{ marginBottom: '64px' }}>
        <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Accommodations
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginTop: '2px' }}>
            Our Chambers &amp; Suites
          </h2>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.9375rem', marginTop: '4px', maxWidth: '700px' }}>
            Each chamber in Harbour Row Hotel is outfitted with period craftsmanship, rich timber floors, custom brass fixtures, and fine Egyptian cotton linens.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
        }}>
          {allRoomTypes.map((rt) => {
            const photo = HOTEL_CONFIG.roomImages[rt.name]
            return (
              <div
                key={rt._id}
                style={{
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-paper)',
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
                      <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-stone)' }}>Tariff From</span>
                      <p style={{ margin: '2px 0 0 0', fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600 }}>
                        {formatINR(rt.baseRate)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-stone)' }}>/ night</span>
                      </p>
                    </div>
                    <button
                      onClick={() => window.scrollTo({ top: 220, behavior: 'smooth' })}
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

      {/* ── Hotel Amenities & Heritage Features ── */}
      <section style={{ marginBottom: '64px', borderTop: '1px solid var(--color-rule)', paddingTop: '40px' }}>
        <div style={{ borderBottom: '1px solid var(--color-rule)', paddingBottom: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Property Offerings
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: '2px' }}>
            Boutique Services &amp; Amenities
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
                backgroundColor: 'var(--color-paper)',
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
              Inquiries
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
                    backgroundColor: 'var(--color-paper)',
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

      {/* ── Contact & Location Register Block ── */}
      <section style={{
        border: 'var(--border)',
        padding: '28px',
        backgroundColor: 'var(--color-paper)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
      }}>
        <div>
          <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Port of Mumbai Location
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
            <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-stone)' }}>Concierge Telephone</span>
            <p style={{ margin: '2px 0 0 0', fontWeight: 600, fontSize: '0.9375rem' }}>{HOTEL_CONFIG.contact.concierge}</p>
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
