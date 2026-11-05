import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DateRangePicker from './DateRangePicker'
import GuestSelector from './GuestSelector'
import { formatShortDate, todayStr, daysFromTodayStr, computeNights } from '../../utils/helpers'

/**
 * 4-Cell Travel Marketplace SearchBar matching reference UI (Attachments #1, #2, #3, #4).
 * Modes:
 * - 'hero': Large overlapping card on hero banner with red pill "Search hotels" button
 * - 'compact': Slim sticky bar at the top of /search results page with red magnifying glass button
 */
export default function SearchBar({
  variant = 'hero',
  initialValues = {},
  roomTypes = [],
  onSearch,
}) {
  const navigate = useNavigate()

  const [selectedRoomType, setSelectedRoomType] = useState(initialValues.roomType || '')
  const [checkIn, setCheckIn] = useState(initialValues.checkIn || todayStr())
  const [checkOut, setCheckOut] = useState(initialValues.checkOut || daysFromTodayStr(2))
  const [rooms, setRooms] = useState(Number(initialValues.rooms) || 1)
  const [adults, setAdults] = useState(Number(initialValues.adults) || 2)
  const [children, setChildren] = useState(
    Array.isArray(initialValues.children) ? initialValues.children : []
  )

  const [activePopover, setActivePopover] = useState(null) // 'dates' | 'guests' | 'type' | null

  // Keep state in sync with initialValues if they change
  useEffect(() => {
    if (initialValues.roomType !== undefined) setSelectedRoomType(initialValues.roomType || '')
    if (initialValues.checkIn) setCheckIn(initialValues.checkIn)
    if (initialValues.checkOut) setCheckOut(initialValues.checkOut)
    if (initialValues.rooms) setRooms(Number(initialValues.rooms))
    if (initialValues.adults) setAdults(Number(initialValues.adults))
    if (initialValues.children) setChildren(initialValues.children)
  }, [
    initialValues.roomType,
    initialValues.checkIn,
    initialValues.checkOut,
    initialValues.rooms,
    initialValues.adults,
    initialValues.children,
  ])

  const nights = computeNights(checkIn, checkOut)

  const handleDateChange = ({ checkIn: cin, checkOut: cout }) => {
    setCheckIn(cin)
    setCheckOut(cout)
  }

  const handleGuestChange = (data) => {
    setRooms(data.rooms)
    setAdults(data.adults)
    setChildren(data.children)
  }

  const handleSearchClick = (e) => {
    if (e) e.preventDefault()
    setActivePopover(null)

    const searchParams = {
      roomType: selectedRoomType,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
    }

    if (onSearch) {
      onSearch(searchParams)
    } else {
      const q = new URLSearchParams()
      if (selectedRoomType) q.set('roomType', selectedRoomType)
      if (checkIn) q.set('checkIn', checkIn)
      if (checkOut) q.set('checkOut', checkOut)
      q.set('rooms', rooms)
      q.set('adults', adults)
      if (children.length > 0) q.set('children', JSON.stringify(children))

      navigate(`/search?${q.toString()}`)
    }
  }

  // Summary strings
  const roomTypeName =
    roomTypes.find((rt) => String(rt._id) === String(selectedRoomType))?.name || 'All Room Types'

  const guestSummary = `${rooms} ${rooms === 1 ? 'Room' : 'Rooms'} · ${adults} ${
    adults === 1 ? 'Adult' : 'Adults'
  }${children.length > 0 ? `, ${children.length} ${children.length === 1 ? 'Child' : 'Children'}` : ''}`

  const isHero = variant === 'hero'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: isHero ? 1100 : '100%',
        margin: '0 auto',
      }}
    >
      {/* 4-Cell Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isHero
            ? '1.2fr 1.6fr 1.2fr auto'
            : '1.2fr 1.5fr 1.2fr auto',
          background: '#FFFFFF',
          borderRadius: 16,
          boxShadow: isHero ? '0 12px 36px rgba(0, 0, 0, 0.16)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E5E7EB',
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        {/* Cell 1: Room Category / Location */}
        <div
          onClick={() => setActivePopover(activePopover === 'type' ? null : 'type')}
          style={{
            padding: '12px 18px',
            borderRight: '1px solid #E5E7EB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            background: activePopover === 'type' ? '#F9FAFB' : 'transparent',
          }}
        >
          <span style={{ fontSize: '1.25rem', color: '#6B7280' }}>🔍</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.75rem',
                color: '#6B7280',
                whiteSpace: 'nowrap',
              }}
            >
              Accommodation Type
            </span>
            <div
              style={{
                fontWeight: 700,
                color: '#111827',
                fontSize: '0.9375rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {roomTypeName}
            </div>
          </div>

          {/* Room Type dropdown */}
          {activePopover === 'type' && (
            <div
              className="animate-popover"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                zIndex: 150,
                background: '#FFFFFF',
                borderRadius: 12,
                boxShadow: 'var(--shadow-dropdown)',
                border: '1px solid #E5E7EB',
                width: 240,
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                onClick={() => {
                  setSelectedRoomType('')
                  setActivePopover(null)
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontWeight: !selectedRoomType ? 700 : 500,
                  background: !selectedRoomType ? '#FEE2E2' : 'transparent',
                  color: !selectedRoomType ? 'var(--color-primary)' : '#111827',
                  borderBottom: '1px solid #F3F4F6',
                }}
              >
                All Room Types
              </div>
              {roomTypes.map((rt) => (
                <div
                  key={rt._id}
                  onClick={() => {
                    setSelectedRoomType(rt._id)
                    setActivePopover(null)
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontWeight: selectedRoomType === rt._id ? 700 : 500,
                    background: selectedRoomType === rt._id ? '#FEE2E2' : 'transparent',
                    color: selectedRoomType === rt._id ? 'var(--color-primary)' : '#111827',
                    borderBottom: '1px solid #F3F4F6',
                    fontSize: '0.875rem',
                  }}
                >
                  {rt.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cell 2: Check-in / Check-out with Nights Arrow */}
        <div
          onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
          style={{
            padding: '12px 18px',
            borderRight: '1px solid #E5E7EB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            background: activePopover === 'dates' ? '#F9FAFB' : 'transparent',
          }}
        >
          {/* Check in */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem', color: '#6B7280' }}>📅</span>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280' }}>Check in</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>
                {formatShortDate(checkIn)}
              </span>
            </div>
          </div>

          {/* Nights pill */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0 8px',
            }}
          >
            <span style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>→</span>
            {nights > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#6B7280', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            )}
          </div>

          {/* Check out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem', color: '#6B7280' }}>📅</span>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280' }}>Check out</span>
              <span style={{ fontWeight: 700, color: '#111827', fontSize: '0.9375rem', whiteSpace: 'nowrap' }}>
                {formatShortDate(checkOut)}
              </span>
            </div>
          </div>

          {/* DateRangePicker Popover */}
          {activePopover === 'dates' && (
            <div onClick={(e) => e.stopPropagation()}>
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onChange={handleDateChange}
                onClose={() => setActivePopover(null)}
              />
            </div>
          )}
        </div>

        {/* Cell 3: Rooms & Guests */}
        <div
          onClick={() => setActivePopover(activePopover === 'guests' ? null : 'guests')}
          style={{
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'relative',
            background: activePopover === 'guests' ? '#F9FAFB' : 'transparent',
          }}
        >
          <span style={{ fontSize: '1.25rem', color: '#6B7280' }}>👥</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
              No. of rooms &amp; guests
            </span>
            <div
              style={{
                fontWeight: 700,
                color: '#111827',
                fontSize: '0.9375rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {guestSummary}
            </div>
          </div>

          {/* GuestSelector Popover */}
          {activePopover === 'guests' && (
            <div onClick={(e) => e.stopPropagation()}>
              <GuestSelector
                rooms={rooms}
                adults={adults}
                children={children}
                onChange={handleGuestChange}
                onClose={() => setActivePopover(null)}
              />
            </div>
          )}
        </div>

        {/* Cell 4: Action Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isHero ? '8px 12px' : '6px 10px',
          }}
        >
          {isHero ? (
            <button
              type="button"
              onClick={handleSearchClick}
              className="btn-primary"
              style={{
                borderRadius: 9999,
                padding: '14px 28px',
                fontSize: '1rem',
                fontWeight: 700,
                background: '#D63941',
                boxShadow: '0 4px 14px rgba(214, 57, 65, 0.4)',
              }}
            >
              Search hotels
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSearchClick}
              aria-label="Search"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#D63941',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                boxShadow: '0 2px 8px rgba(214, 57, 65, 0.4)',
              }}
            >
              🔍
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

