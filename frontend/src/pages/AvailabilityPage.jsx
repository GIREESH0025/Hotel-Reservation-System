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
  const [copiedCode, setCopiedCode] = useState(null)

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

  const handleCopyCoupon = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    addToast(`Coupon "${code}" copied to clipboard!`, 'success')
    setTimeout(() => setCopiedCode(null), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)' }}>
      {/* ── 1. Hero Banner with Deep Maroon Gradient ──────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #6E1426 0%, #8C1C30 50%, #B3263A 100%)',
          color: '#FFFFFF',
          padding: '64px 24px 96px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 16,
              backdropFilter: 'blur(4px)',
            }}
          >
            ★ Historic Waterfront Heritage · Colaba, Mumbai
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            {HOTEL_CONFIG.name}
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: '#FDE8E9',
              maxWidth: 680,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Refined guest chambers, sweeping harbour waters, and authentic hospitality steps from the
            Gateway of India.
          </p>
        </div>
      </section>

      {/* ── 2. Overlapping 4-Cell Search Bar ───────────────────────────────── */}
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '-48px auto 0',
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

      <div className="page-container" style={{ marginTop: 48, paddingBottom: 64 }}>
        {/* ── 3. Active Offers Strip ────────────────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                Exclusive Direct Booking Offers
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                Apply these verified promo codes at checkout for instant savings.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {HOTEL_CONFIG.offers?.map((offer) => (
              <div
                key={offer.code}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      marginBottom: 6,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {offer.badge}
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                    {offer.title}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: 2 }}>
                    {offer.desc}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCoupon(offer.code)}
                  style={{
                    background: copiedCode === offer.code ? 'var(--color-success-bg)' : '#F9FAFB',
                    border: `1.5px dashed ${copiedCode === offer.code ? 'var(--color-success)' : '#D1D5DB'}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: copiedCode === offer.code ? 'var(--color-success)' : '#111827',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms ease',
                  }}
                >
                  {copiedCode === offer.code ? '✓ Copied' : offer.code}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. Room Types & Rates Showcase ────────────────────────────────── */}
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
