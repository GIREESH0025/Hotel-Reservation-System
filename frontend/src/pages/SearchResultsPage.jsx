import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { roomsApi } from '../api/rooms.api'
import { roomTypesApi } from '../api/roomTypes.api'
import { useTitle } from '../hooks/useTitle'
import SearchBar from '../components/search/SearchBar'
import RangeSlider from '../components/ui/RangeSlider'
import { formatINR, todayStr, daysFromTodayStr, computeNights } from '../utils/helpers'

export default function SearchResultsPage() {
  useTitle('Search Results — Harbour Row Hotel')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // 1. Read URL Query Parameters
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
  const roomTypeParam = searchParams.get('roomType') || ''
  const bedTypeParam = searchParams.get('bedType') || ''
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : null
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : null
  const mealPlanParam = searchParams.get('mealPlan') || ''
  const freeCancelParam = searchParams.get('freeCancellation') === 'true'
  const sortParam = searchParams.get('sort') || 'recommended'

  const nights = computeNights(checkIn, checkOut)

  // 2. Component State
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [facets, setFacets] = useState(null)
  const [roomTypesCatalog, setRoomTypesCatalog] = useState([])
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Filter States
  const [selectedBedTypes, setSelectedBedTypes] = useState(bedTypeParam ? [bedTypeParam] : [])
  const [selectedAmenities, setSelectedAmenities] = useState([])
  const [priceRange, setPriceRange] = useState([minPriceParam || 1000, maxPriceParam || 25000])
  const [freeCancelOnly, setFreeCancelOnly] = useState(freeCancelParam)
  const [selectedSort, setSelectedSort] = useState(sortParam)

  // Load Room Types for SearchBar Dropdown
  useEffect(() => {
    roomTypesApi.list({ limit: 12 }).then((res) => {
      setRoomTypesCatalog(res.data?.data || [])
    }).catch(() => {})
  }, [])

  // Sync state with URL params
  useEffect(() => {
    setSelectedBedTypes(bedTypeParam ? [bedTypeParam] : [])
    setFreeCancelOnly(freeCancelParam)
    setSelectedSort(sortParam)
    if (minPriceParam || maxPriceParam) {
      setPriceRange([minPriceParam || 1000, maxPriceParam || 25000])
    }
  }, [bedTypeParam, freeCancelParam, sortParam, minPriceParam, maxPriceParam])

  // 3. Fetch Availability from Backend
  useEffect(() => {
    let isMounted = true
    async function fetchResults() {
      try {
        setLoading(true)
        const query = {
          checkIn,
          checkOut,
          rooms: roomsCount,
          adults,
          children: parsedChildren.length,
          sort: selectedSort,
        }
        if (roomTypeParam) query.roomType = roomTypeParam
        if (selectedBedTypes.length === 1) query.bedType = selectedBedTypes[0]
        if (priceRange[0] > 1000) query.minPrice = priceRange[0]
        if (priceRange[1] < 25000) query.maxPrice = priceRange[1]
        if (selectedAmenities.length > 0) query.amenities = selectedAmenities.join(',')
        if (freeCancelOnly) query.freeCancellation = 'true'

        const res = await roomsApi.availability(query)
        if (!isMounted) return

        const data = res.data?.data || []
        setResults(data)
        if (res.data?.facets) setFacets(res.data.facets)
      } catch (err) {
        console.error('Error fetching availability:', err)
        if (isMounted) setResults([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchResults()
    return () => { isMounted = false }
  }, [
    checkIn,
    checkOut,
    roomsCount,
    adults,
    parsedChildren.length,
    roomTypeParam,
    selectedBedTypes,
    priceRange,
    selectedAmenities,
    freeCancelOnly,
    selectedSort,
  ])

  // Update URL helper
  const updateURLParams = (newParams) => {
    const updated = new URLSearchParams(searchParams)
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
        updated.delete(k)
      } else if (Array.isArray(v)) {
        updated.set(k, v.join(','))
      } else {
        updated.set(k, String(v))
      }
    })
    setSearchParams(updated)
  }

  const handleBedTypeToggle = (type) => {
    const next = selectedBedTypes.includes(type)
      ? selectedBedTypes.filter((t) => t !== type)
      : [...selectedBedTypes, type]
    setSelectedBedTypes(next)
    updateURLParams({ bedType: next[0] || null })
  }

  const handleAmenityToggle = (amenity) => {
    const next = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity]
    setSelectedAmenities(next)
  }

  const handlePriceChange = (min, max) => {
    setPriceRange([min, max])
    updateURLParams({ minPrice: min > 1000 ? min : null, maxPrice: max < 25000 ? max : null })
  }

  const handleSortChange = (newSort) => {
    setSelectedSort(newSort)
    updateURLParams({ sort: newSort })
  }

  const clearAllFilters = () => {
    setSelectedBedTypes([])
    setSelectedAmenities([])
    setPriceRange([1000, 25000])
    setFreeCancelOnly(false)
    setSelectedSort('recommended')
    const cleared = new URLSearchParams()
    cleared.set('checkIn', checkIn)
    cleared.set('checkOut', checkOut)
    cleared.set('rooms', roomsCount)
    cleared.set('adults', adults)
    if (parsedChildren.length > 0) cleared.set('children', JSON.stringify(parsedChildren))
    setSearchParams(cleared)
  }

  const activeFilterCount =
    (selectedBedTypes.length > 0 ? 1 : 0) +
    (selectedAmenities.length > 0 ? 1 : 0) +
    (priceRange[0] > 1000 || priceRange[1] < 25000 ? 1 : 0) +
    (freeCancelOnly ? 1 : 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas)', paddingBottom: 64 }}>
      {/* ── Sticky Compact Search Bar ──────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 64,
          zIndex: 40,
          background: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '12px 24px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <SearchBar
            variant="compact"
            roomTypes={roomTypesCatalog}
            initialValues={{
              roomType: roomTypeParam,
              checkIn,
              checkOut,
              rooms: roomsCount,
              adults,
              children: parsedChildren,
            }}
          />
        </div>
      </div>

      <div className="page-container" style={{ marginTop: 24 }}>
        {/* Results Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
              Available Chambers &amp; Suites
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: 2 }}>
              {loading
                ? 'Searching live inventory...'
                : `${results.length} room ${results.length === 1 ? 'type' : 'types'} available for ${nights} ${
                    nights === 1 ? 'night' : 'nights'
                  }`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
              <span style={{ color: '#6B7280', fontWeight: 500 }}>Sort by:</span>
              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  background: '#FFFFFF',
                  fontWeight: 600,
                  color: '#111827',
                }}
              >
                <option value="recommended">Recommended</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="capacity">Capacity (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Two-Column Main Grid ───────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {/* Left Column: Filter Sidebar */}
          <aside
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E5E7EB',
              padding: '20px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                borderBottom: '1px solid #F3F4F6',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Filters</span>
                {activeFilterCount > 0 && (
                  <span
                    style={{
                      background: 'var(--color-primary)',
                      color: '#FFFFFF',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Price Range Filter */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', marginBottom: 12 }}>
                Price per night
              </div>
              <RangeSlider
                min={1000}
                max={25000}
                currentMin={priceRange[0]}
                currentMax={priceRange[1]}
                onChange={handlePriceChange}
              />
            </div>

            {/* Bed Type Filter */}
            <div style={{ marginBottom: 24, borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', marginBottom: 12 }}>
                Bed Type
              </div>
              {['King Bed', 'Queen Bed', 'Twin Beds'].map((type) => (
                <label
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.875rem',
                    color: '#374151',
                    marginBottom: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedBedTypes.includes(type)}
                    onChange={() => handleBedTypeToggle(type)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>

            {/* Free Cancellation Toggle */}
            <div style={{ marginBottom: 24, borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                    Free Cancellation
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Cancel up to 48h prior</div>
                </div>
                <input
                  type="checkbox"
                  checked={freeCancelOnly}
                  onChange={(e) => {
                    setFreeCancelOnly(e.target.checked)
                    updateURLParams({ freeCancellation: e.target.checked ? 'true' : null })
                  }}
                  style={{ accentColor: 'var(--color-primary)', width: 18, height: 18 }}
                />
              </label>
            </div>

            {/* Popular Amenities */}
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', marginBottom: 12 }}>
                Room Amenities
              </div>
              {['Wi-Fi', 'Air Conditioning', 'Bathtub', 'Ocean View', 'Balcony', 'Mini Bar'].map((am) => (
                <label
                  key={am}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.875rem',
                    color: '#374151',
                    marginBottom: 8,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(am)}
                    onChange={() => handleAmenityToggle(am)}
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <span>{am}</span>
                </label>
              ))}
            </div>
          </aside>

          {/* Right Column: Room Results List */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      padding: 20,
                      display: 'flex',
                      gap: 20,
                    }}
                  >
                    <div className="skeleton" style={{ width: 260, height: 180, borderRadius: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 24, width: '50%', marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                      <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 16 }} />
                      <div className="skeleton" style={{ height: 36, width: 140 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E5E7EB',
                  padding: '48px 24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                  No room categories match your criteria
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', maxWidth: 460, margin: '0 auto 20px' }}>
                  Try broadening your price filters, selecting different dates, or clearing your selected amenities.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="btn-primary"
                  style={{ borderRadius: 9999 }}
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {results.map((item) => {
                  const rt = item.roomType
                  const ratePerNight = rt.baseRate
                  const totalStayCost = ratePerNight * nights * roomsCount
                  const photo =
                    rt.images?.[0] ||
                    rt.image ||
                    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'

                  const availableCount = item.availableRooms ?? 4

                  return (
                    <div
                      key={rt._id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'grid',
                        gridTemplateColumns: '280px 1fr 240px',
                        transition: 'box-shadow 200ms ease, transform 200ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                      }}
                    >
                      {/* Column 1: Image & Urgency indicator */}
                      <div style={{ position: 'relative', height: '100%', minHeight: 200 }}>
                        <img
                          src={photo}
                          alt={rt.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Real inventory countdown when <= 3 */}
                        {availableCount <= 3 && availableCount > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 12,
                              left: 12,
                              background: '#EF4444',
                              color: '#FFFFFF',
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              letterSpacing: '0.02em',
                            }}
                          >
                            Only {availableCount} left!
                          </div>
                        )}
                      </div>

                      {/* Column 2: Specs & Highlights */}
                      <div
                        style={{
                          padding: '20px 24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderRight: '1px solid #F3F4F6',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>
                              {rt.name}
                            </h2>
                          </div>

                          <div
                            style={{
                              fontSize: '0.8125rem',
                              color: '#4B5563',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            <span>📐 {rt.size ? `${rt.size} sq m` : '32 sq m'}</span>
                            <span>•</span>
                            <span>🛏 {rt.bedType || 'King Bed'}</span>
                            <span>•</span>
                            <span>👥 Max {rt.maxOccupancy || rt.capacity || 2} Guests</span>
                          </div>

                          <p
                            style={{
                              fontSize: '0.8125rem',
                              color: '#6B7280',
                              lineHeight: 1.5,
                              marginBottom: 12,
                            }}
                          >
                            {rt.description}
                          </p>

                          {/* Amenity Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(rt.highlights || rt.amenities || []).slice(0, 3).map((hl, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: '#F3F4F6',
                                  color: '#374151',
                                  fontSize: '0.75rem',
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                }}
                              >
                                ✓ {hl}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Free Cancellation Note */}
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-success)',
                            fontWeight: 600,
                            marginTop: 12,
                          }}
                        >
                          ✓ Free cancellation up to 48h before check-in
                        </div>
                      </div>

                      {/* Column 3: Pricing & Book CTA */}
                      <div
                        style={{
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          background: '#FAFBFD',
                          textAlign: 'right',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Per night</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
                            {formatINR(ratePerNight)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>+ taxes &amp; fees</div>

                          {/* Stay total */}
                          <div
                            style={{
                              marginTop: 16,
                              padding: '8px 12px',
                              background: '#FFFFFF',
                              borderRadius: 8,
                              border: '1px solid #E5E7EB',
                            }}
                          >
                            <div style={{ fontSize: '0.6875rem', color: '#6B7280' }}>
                              {roomsCount} {roomsCount === 1 ? 'room' : 'rooms'} × {nights}{' '}
                              {nights === 1 ? 'night' : 'nights'}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827' }}>
                              {formatINR(totalStayCost)}
                            </div>
                          </div>
                        </div>

                        <Link
                          to={`/rooms/${rt._id}?checkIn=${checkIn}&checkOut=${checkOut}&rooms=${roomsCount}&adults=${adults}${
                            parsedChildren.length > 0 ? `&children=${JSON.stringify(parsedChildren)}` : ''
                          }`}
                          className="btn-primary"
                          style={{
                            width: '100%',
                            padding: '12px 0',
                            borderRadius: 9999,
                            fontWeight: 700,
                            fontSize: '0.9375rem',
                          }}
                        >
                          Select room
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

