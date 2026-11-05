import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roomTypesApi } from '../api/roomTypes.api'
import { useTitle } from '../hooks/useTitle'
import { HOTEL_CONFIG } from '../config/hotel.config'
import SearchBar from '../components/search/SearchBar'
import { formatINR, todayStr, daysFromTodayStr } from '../utils/helpers'
import { useToast } from '../context/ToastContext'

export default function AvailabilityPage() {
  useTitle('Harbour Row Hotel — Boutique Waterfront Lodgings')
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState(null)

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true)
        const res = await roomTypesApi.list({ limit: 12 })
        setRoomTypes(res.data?.data || [])
      } catch (err) {
        console.error('Failed to load room types:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCatalog()
  }, [])

  const heroRoomType = roomTypes.find((r) => r.name === 'Deluxe King') || roomTypes[0]
  const heroImageSrc =
    heroRoomType?.images?.[0] ||
    heroRoomType?.image ||
    HOTEL_CONFIG.roomImages?.['Deluxe King'] ||
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
  const heroRoomName = heroRoomType?.name || 'Deluxe King'
  const heroRoomRate = heroRoomType?.baseRate || 4800

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)' }}>
      {/* ── 1. Restored Editorial Two-Column Hero Section ─────────────────── */}
      <section style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '40px 24px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 40,
            alignItems: 'center',
          }}
        >
          {/* Left Column: Heading, Subtitle & Key Features */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-primary, #D63941)',
                  fontWeight: 700,
                  background: '#FEE2E2',
                  padding: '4px 12px',
                  borderRadius: 20,
                }}
              >
                ★ Est. 1924 · Waterfront Heritage · Colaba, Mumbai
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
                lineHeight: 1.15,
                color: '#111827',
                margin: '0 0 16px 0',
                letterSpacing: '-0.02em',
                fontWeight: 800,
              }}
            >
              Stay at Harbour Row, Colaba.
            </h1>

            <p
              style={{
                fontSize: '1.0625rem',
                color: '#4B5563',
                lineHeight: 1.6,
                margin: '0 0 24px 0',
                maxWidth: 540,
              }}
            >
              Refined guest chambers, sweeping harbour waters, and authentic hospitality steps from the
              Gateway of India. Direct reservations guarantee our best room rates and flexible arrival.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-primary, #D63941)' }}>✓</span> Historic Colaba Waterfront
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-primary, #D63941)' }}>✓</span> 24hr Front Desk &amp; Concierge
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: '#374151', fontWeight: 600 }}>
                <span style={{ color: 'var(--color-primary, #D63941)' }}>✓</span> Best Direct Tariff Guarantee
              </div>
            </div>
          </div>

          {/* Right Column: Featured Room Photography & Subtle Plaque */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                height: '100%',
                minHeight: 340,
                border: '1px solid #E5E7EB',
                position: 'relative',
                backgroundColor: '#F3F4F6',
                boxShadow: 'var(--shadow-card, 0 10px 25px -5px rgba(0, 0, 0, 0.1))',
              }}
            >
              <img
                src={heroImageSrc}
                alt={heroRoomName}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 340,
                  maxHeight: 420,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Image gradient overlay for caption legibility */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '24px 20px 16px 20px',
                  background:
                    'linear-gradient(to top, rgba(26,20,16,0.9) 0%, rgba(26,20,16,0.45) 60%, transparent 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      opacity: 0.85,
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    Featured Chamber
                  </span>
                  <div
                    style={{
                      fontFamily: 'var(--font-display, "Playfair Display", Georgia, serif)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                    }}
                  >
                    {heroRoomName}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.6875rem', opacity: 0.85, display: 'block' }}>Direct rate from</span>
                  <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#FFFFFF' }}>
                    {formatINR(heroRoomRate)}{' '}
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.85 }}>/ night</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. The 4-Cell Search Bar ───────────────────────────────── */}
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '8px auto 0',
          padding: '0 24px',
          position: 'relative',
          zIndex: 40,
        }}
      >
        <SearchBar
          variant="hero"
          roomTypes={roomTypes}
          initialValues={{
            checkIn: todayStr(),
            checkOut: daysFromTodayStr(2),
            rooms: 1,
            adults: 2,
          }}
        />
      </div>

      <div className="page-container" style={{ marginTop: 40, paddingBottom: 64 }}>
        {/* ── 3. Room Types & Rates Showcase ────────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                Featured Chambers &amp; Suites
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: 4 }}>
                Each room is uniquely appointed with teak millwork, climate control, and en-suite bath.
              </p>
            </div>
            <Link
              to="/search"
              style={{
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Browse all room categories →
            </Link>
          </div>

          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="card" style={{ height: 380, padding: 0, overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: 200, width: '100%' }} />
                  <div style={{ padding: 20 }}>
                    <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 16, width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 24,
              }}
            >
              {roomTypes.map((rt) => {
                const photo =
                  rt.images?.[0] ||
                  rt.image ||
                  HOTEL_CONFIG.roomImages?.[rt.name] ||
                  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'

                return (
                  <div
                    key={rt._id}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 200ms ease, box-shadow 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }}
                  >
                    {/* Room Image */}
                    <div style={{ height: 210, position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={photo}
                        alt={rt.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: 'rgba(17, 24, 39, 0.75)',
                          backdropFilter: 'blur(4px)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {rt.bedType || 'King Bed'} · {rt.size ? `${rt.size} sq m` : 'Spacious'}
                      </div>
                    </div>

                    {/* Room Content */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                        {rt.name}
                      </h3>

                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: '#4B5563',
                          lineHeight: 1.5,
                          marginBottom: 16,
                          flex: 1,
                        }}
                      >
                        {rt.description}
                      </p>

                      {/* Highlights Pill Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                        {(rt.highlights || rt.amenities || []).slice(0, 3).map((hl, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: '#F3F4F6',
                              color: '#374151',
                              fontSize: '0.75rem',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontWeight: 500,
                            }}
                          >
                            ✓ {hl}
                          </span>
                        ))}
                      </div>

                      {/* Price & Action */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          borderTop: '1px solid #F3F4F6',
                          paddingTop: 16,
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>
                            Starting from
                          </span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                            {formatINR(rt.baseRate)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}> / night</span>
                        </div>

                        <Link
                          to={`/rooms/${rt._id}`}
                          className="btn-primary"
                          style={{
                            padding: '9px 18px',
                            fontSize: '0.875rem',
                            borderRadius: 9999,
                          }}
                        >
                          Explore Room
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── 5. Hotel Amenities ────────────────────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: 20 }}>
            Curated Hotel Amenities
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {HOTEL_CONFIG.amenities?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>✨</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', marginBottom: 4 }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#6B7280', lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. Guest Policies & Information ───────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: 20 }}>
            Essential Stay Policies
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 20,
            }}
          >
            {HOTEL_CONFIG.policies?.map((pol, idx) => (
              <div
                key={idx}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  padding: '20px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', marginBottom: 6 }}>
                  {pol.title}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#4B5563', lineHeight: 1.5 }}>
                  {pol.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. Frequently Asked Questions ─────────────────────────────────── */}
        <section style={{ marginBottom: 56, maxWidth: 840 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: 20 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HOTEL_CONFIG.faqs?.map((faq, idx) => {
              const isOpen = expandedFaq === idx
              return (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      color: '#111827',
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1.1rem', color: '#9CA3AF' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 16px',
                        fontSize: '0.875rem',
                        color: '#4B5563',
                        lineHeight: 1.6,
                        borderTop: '1px solid #F3F4F6',
                        paddingTop: 12,
                      }}
                    >
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
