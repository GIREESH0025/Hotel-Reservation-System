import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomsApi } from '../api/rooms.api'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { formatINR, todayStr, daysFromTodayStr, computeNights } from '../utils/helpers'

export default function AvailabilityPage() {
  const [checkIn, setCheckIn] = useState(todayStr())
  const [checkOut, setCheckOut] = useState(daysFromTodayStr(2))
  const [adults, setAdults] = useState(2)
  const [errors, setErrors] = useState({})

  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [fetchError, setFetchError] = useState(null)

  const navigate = useNavigate()

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
      {/* Registration-card hero section */}
      <section style={{ border: 'var(--border)', padding: '32px', backgroundColor: 'var(--color-paper)', marginBottom: '40px', borderRadius: 'var(--radius)' }}>
        <div style={{ borderBottom: '2px solid var(--color-ink)', paddingBottom: '16px', marginBottom: '24px' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-stone)', fontWeight: 600 }}>
            Harbour Row Hotel &bull; Guest Register
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginTop: '4px' }}>
            Check Room Availability
          </h1>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.9375rem', marginTop: '4px' }}>
            Search vacant chambers by arrival date, departure date, and guest count.
          </p>
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
              label="Adults"
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
            />

            <div style={{ paddingTop: '24px' }}>
              <Button type="submit" variant="primary" loading={loading} style={{ width: '100%' }}>
                Find Available Rooms
              </Button>
            </div>
          </div>

          {nights > 0 && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', marginTop: '16px' }}>
              Stay duration: <strong>{nights} night{nights > 1 ? 's' : ''}</strong>
            </p>
          )}
        </form>
      </section>

      {/* Results Section */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: 'var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>
            Available Accommodations
          </h2>
          {searched && !loading && (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-stone)' }}>
              {results.length} room type{results.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Skeleton height="100px" />
            <Skeleton height="100px" />
            <Skeleton height="100px" />
          </div>
        )}

        {fetchError && (
          <ErrorState message={fetchError} onRetry={handleSearch} />
        )}

        {!loading && !fetchError && searched && results.length === 0 && (
          <EmptyState
            title="No vacant rooms match your request"
            message={`No rooms are available for ${adults} adult${adults > 1 ? 's' : ''} between ${checkIn} and ${checkOut}. Please select alternative dates.`}
          />
        )}

        {!loading && !fetchError && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {results.map((item) => {
              const rt = item.roomType
              const totalEst = item.rate * nights
              return (
                <div
                  key={rt._id}
                  style={{
                    borderBottom: 'var(--border)',
                    padding: '24px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '24px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', margin: 0 }}>
                        {rt.name}
                      </h3>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)' }}>
                        Capacity: up to {rt.capacity} adults
                      </span>
                    </div>

                    <p style={{ color: 'var(--color-ink)', fontSize: '0.9375rem', marginTop: '6px', lineHeight: 1.5 }}>
                      {rt.description}
                    </p>

                    {rt.amenities && rt.amenities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                        {rt.amenities.map((am) => (
                          <span
                            key={am}
                            style={{
                              padding: '2px 8px',
                              border: 'var(--border)',
                              fontSize: '0.75rem',
                              color: 'var(--color-stone)',
                              backgroundColor: 'transparent',
                              borderRadius: 'var(--radius)',
                            }}
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', minWidth: '180px' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatINR(item.rate)}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)' }}> / night</span>
                    </div>

                    {nights > 0 && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-stone)', fontVariantNumeric: 'tabular-nums' }}>
                        Total for {nights} nights: {formatINR(totalEst)}
                      </span>
                    )}

                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-moss)', fontWeight: 500 }}>
                      {item.availableCount} chamber{item.availableCount > 1 ? 's' : ''} vacant
                    </span>

                    <Button
                      variant="primary"
                      onClick={() => handleBook(item)}
                      style={{ marginTop: '4px' }}
                    >
                      Book Room
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!searched && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--color-stone)' }}>
            <p style={{ fontStyle: 'italic', fontSize: '1rem' }}>
              Select your dates above to review vacant chambers and rates.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
