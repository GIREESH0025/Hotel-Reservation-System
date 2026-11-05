import React, { useState, useEffect, useRef } from 'react'
import { formatShortDate, formatISODate, computeNights } from '../../utils/helpers'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Custom dual-month DateRangePicker matching the travel marketplace reference.
 * - Dual-month layout on desktop, single month on mobile
 * - Mon-Sun columns with Sat & Sun colored in red (#D63941)
 * - Dark continuous selection range (#2E2E2E) with white numbers
 * - Arrow with "N Nights" counter
 * - Fully accessible with keyboard & click-outside dismissal
 */
export default function DateRangePicker({
  checkIn,
  checkOut,
  onChange,
  onClose,
  minDate = new Date().toISOString().split('T')[0],
}) {
  const containerRef = useRef(null)

  // Initialize current viewing month based on checkIn or current date
  const initialDate = checkIn ? new Date(checkIn + 'T00:00:00Z') : new Date()
  const [currentYear, setCurrentYear] = useState(initialDate.getUTCFullYear())
  const [currentMonth, setCurrentMonth] = useState(initialDate.getUTCMonth()) // 0-indexed
  const [hoverDate, setHoverDate] = useState(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (onClose) onClose()
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const prevMonth = () => {
    const today = new Date()
    const isCurrentMonthOrEarlier =
      currentYear < today.getFullYear() ||
      (currentYear === today.getFullYear() && currentMonth <= today.getMonth())
    if (isCurrentMonthOrEarlier) return

    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  // Generate matrix for a month (Mon=0, Sun=6)
  const getMonthMatrix = (year, month) => {
    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay = new Date(Date.UTC(year, month + 1, 0))
    const daysInMonth = lastDay.getUTCDate()

    // getUTCDay: 0=Sun, 1=Mon, ..., 6=Sat -> convert to Mon=0 ... Sun=6
    let startingDay = firstDay.getUTCDay() - 1
    if (startingDay === -1) startingDay = 6

    const matrix = []
    let currentWeek = []

    // Empty cells before 1st of month
    for (let i = 0; i < startingDay; i++) {
      currentWeek.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      currentWeek.push({ day, dateStr })
      if (currentWeek.length === 7) {
        matrix.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      matrix.push(currentWeek)
    }

    return matrix
  }

  const handleDateClick = (dateStr) => {
    if (dateStr < minDate) return

    // If both checkIn and checkOut are set, or nothing is set: start new selection
    if (!checkIn || (checkIn && checkOut)) {
      onChange({ checkIn: dateStr, checkOut: '' })
      return
    }

    // If only checkIn is set:
    if (checkIn && !checkOut) {
      if (dateStr < checkIn) {
        // Clicked date is before checkIn, reset checkIn to clicked date
        onChange({ checkIn: dateStr, checkOut: '' })
      } else if (dateStr === checkIn) {
        // Same day: prompt requires >= 1 night, do not allow same-day check-in/out
        return
      } else {
        // Valid checkout date
        const nights = computeNights(checkIn, dateStr)
        if (nights > 30) return // Stay max 30 nights
        onChange({ checkIn, checkOut: dateStr })
        if (onClose) onClose()
      }
    }
  }

  const renderMonthView = (year, month, showPrev = false, showNext = false) => {
    const matrix = getMonthMatrix(year, month)
    const todayStr = formatISODate(new Date())

    return (
      <div className="month-calendar" style={{ minWidth: 280, flex: 1 }}>
        {/* Month Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            marginBottom: 8,
          }}
        >
          {showPrev ? (
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.1rem',
                color: '#4B5563',
                padding: '4px 8px',
                borderRadius: '50%',
              }}
            >
              ←
            </button>
          ) : (
            <div style={{ width: 28 }} />
          )}

          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
            {MONTH_NAMES[month]} {year}
          </div>

          {showNext ? (
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.1rem',
                color: '#4B5563',
                padding: '4px 8px',
                borderRadius: '50%',
              }}
            >
              →
            </button>
          ) : (
            <div style={{ width: 28 }} />
          )}
        </div>

        {/* Weekday Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#6B7280',
            marginBottom: 8,
          }}
        >
          {WEEKDAYS.map((wd, idx) => (
            <div
              key={wd}
              style={{
                color: idx >= 5 ? 'var(--color-weekend)' : '#6B7280',
                padding: '4px 0',
              }}
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
          {matrix.map((week, wIdx) =>
            week.map((cell, dIdx) => {
              if (!cell) {
                return <div key={`empty-${wIdx}-${dIdx}`} style={{ height: 38 }} />
              }

              const { day, dateStr } = cell
              const isPast = dateStr < minDate
              const isWeekend = dIdx >= 5
              const isCheckIn = dateStr === checkIn
              const isCheckOut = dateStr === checkOut
              const isInRange =
                checkIn &&
                checkOut &&
                dateStr > checkIn &&
                dateStr < checkOut
              const isHoverRange =
                checkIn &&
                !checkOut &&
                hoverDate &&
                dateStr > checkIn &&
                dateStr <= hoverDate

              // Styling calculation for continuous dark range band
              let bg = 'transparent'
              let color = isWeekend ? 'var(--color-weekend)' : '#111827'
              let borderRadius = '0'

              if (isPast) {
                color = '#D1D5DB'
              } else if (isCheckIn && isCheckOut) {
                bg = 'var(--color-range-band)'
                color = '#FFFFFF'
                borderRadius = '20px'
              } else if (isCheckIn) {
                bg = 'var(--color-range-band)'
                color = '#FFFFFF'
                borderRadius = '20px 0 0 20px'
              } else if (isCheckOut) {
                bg = 'var(--color-range-band)'
                color = '#FFFFFF'
                borderRadius = '0 20px 20px 0'
              } else if (isInRange) {
                bg = 'var(--color-range-band)'
                color = '#FFFFFF'
                borderRadius = '0'
              } else if (isHoverRange) {
                bg = 'rgba(46, 46, 46, 0.15)'
                borderRadius = dateStr === hoverDate ? '0 20px 20px 0' : '0'
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleDateClick(dateStr)}
                  onMouseEnter={() => !checkOut && setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                  style={{
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: bg,
                    color: color,
                    border: 'none',
                    borderRadius: borderRadius,
                    fontSize: '0.875rem',
                    fontWeight: isCheckIn || isCheckOut || isInRange ? 600 : 400,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    transition: 'background 100ms ease',
                    position: 'relative',
                  }}
                >
                  {day}
                </button>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Calculate next month index
  const nextY = currentMonth === 11 ? currentYear + 1 : currentYear
  const nextM = currentMonth === 11 ? 0 : currentMonth + 1

  const nightsCount = checkIn && checkOut ? computeNights(checkIn, checkOut) : 0

  return (
    <div
      ref={containerRef}
      className="animate-popover"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 0,
        zIndex: 150,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: 'var(--shadow-dropdown)',
        border: '1px solid #E5E7EB',
        padding: '16px 20px',
        width: 'max-content',
        maxWidth: '92vw',
      }}
    >
      {/* Top summary row inside calendar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F3F4F6',
          paddingBottom: 12,
          marginBottom: 12,
          fontSize: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <span style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>Check-in</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{formatShortDate(checkIn) || 'Select date'}</span>
          </div>
          <span style={{ color: '#9CA3AF' }}>→</span>
          <div>
            <span style={{ color: '#6B7280', fontSize: '0.75rem', display: 'block' }}>Check-out</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{formatShortDate(checkOut) || 'Select date'}</span>
          </div>
        </div>

        {nightsCount > 0 && (
          <div
            style={{
              background: '#F3F4F6',
              color: '#111827',
              padding: '4px 12px',
              borderRadius: 20,
              fontWeight: 600,
              fontSize: '0.8125rem',
            }}
          >
            {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
          </div>
        )}
      </div>

      {/* Dual Month View on desktop */}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {renderMonthView(currentYear, currentMonth, true, false)}
        <div className="desktop-second-month" style={{ display: 'flex' }}>
          {renderMonthView(nextY, nextM, false, true)}
        </div>
      </div>
    </div>
  )
}

