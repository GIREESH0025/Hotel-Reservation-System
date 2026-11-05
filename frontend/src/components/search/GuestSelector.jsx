import React, { useEffect, useRef } from 'react'
import { DoorIcon, TrashIcon, UsersIcon, ChildIcon } from '../ui/Icons'

/**
 * Guest & Room selector popover matching reference UI (Attachment #3).
 * Supports:
 * - 1 to 3 Rooms
 * - Adults (min = roomsCount, max = 4 * roomsCount)
 * - Children (0-4 total) with individual age selectors
 * - Accessible stepper buttons, trash/minus states, and keyboard escape dismissal
 */
export default function GuestSelector({
  rooms = 1,
  adults = 2,
  children = [],
  onChange,
  onClose,
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (onClose) onClose()
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleRoomsChange = (delta) => {
    const nextRooms = Math.min(3, Math.max(1, rooms + delta))
    // Rule: Adults must be at least equal to number of rooms (1 adult per room)
    const nextAdults = Math.max(nextRooms, adults)
    onChange({ rooms: nextRooms, adults: nextAdults, children })
  }

  const handleAdultsChange = (delta) => {
    // Adults cannot be less than number of rooms
    const minAdults = rooms
    const maxAdults = rooms * 4
    const nextAdults = Math.min(maxAdults, Math.max(minAdults, adults + delta))
    onChange({ rooms, adults: nextAdults, children })
  }

  const handleAddChild = () => {
    if (children.length >= 4) return
    const nextChildren = [...children, { age: 6 }] // default age 6
    onChange({ rooms, adults, children: nextChildren })
  }

  const handleRemoveChild = (index) => {
    const nextChildren = children.filter((_, idx) => idx !== index)
    onChange({ rooms, adults, children: nextChildren })
  }

  const handleChildAgeChange = (index, age) => {
    const nextChildren = children.map((c, idx) => (idx === index ? { age: Number(age) } : c))
    onChange({ rooms, adults, children: nextChildren })
  }

  return (
    <div
      ref={containerRef}
      className="animate-popover"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 150,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: 'var(--shadow-dropdown)',
        border: '1px solid #E5E7EB',
        padding: '20px',
        width: 320,
      }}
    >
      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: 16 }}>
        Select no. of rooms & guests
      </div>

      {/* Row 1: Rooms */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <DoorIcon size={20} color="#4B5563" />
          <div>
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>Rooms</div>
          </div>
        </div>

        {/* Stepper pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: 24,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            disabled={rooms <= 1}
            onClick={() => handleRoomsChange(-1)}
            aria-label="Decrease rooms"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'transparent',
              cursor: rooms <= 1 ? 'not-allowed' : 'pointer',
              color: rooms <= 1 ? '#FDA4AF' : '#111827',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {rooms <= 1 ? <TrashIcon size={14} color="#FDA4AF" /> : '−'}
          </button>
          <span style={{ width: 28, textAlign: 'center', fontWeight: 600, color: '#111827' }}>
            {rooms}
          </span>
          <button
            type="button"
            disabled={rooms >= 3}
            onClick={() => handleRoomsChange(1)}
            aria-label="Increase rooms"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'transparent',
              cursor: rooms >= 3 ? 'not-allowed' : 'pointer',
              color: rooms >= 3 ? '#FDA4AF' : '#111827',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Row 2: Adults */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <UsersIcon size={20} color="#4B5563" />
          <div>
            <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>Adults</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>18 years & above</div>
          </div>
        </div>

        {/* Stepper pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            borderRadius: 24,
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            disabled={adults <= rooms}
            onClick={() => handleAdultsChange(-1)}
            aria-label="Decrease adults"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'transparent',
              cursor: adults <= rooms ? 'not-allowed' : 'pointer',
              color: adults <= rooms ? '#FDA4AF' : '#111827',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            −
          </button>
          <span style={{ width: 28, textAlign: 'center', fontWeight: 600, color: '#111827' }}>
            {adults}
          </span>
          <button
            type="button"
            disabled={adults >= rooms * 4}
            onClick={() => handleAdultsChange(1)}
            aria-label="Increase adults"
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'transparent',
              cursor: adults >= rooms * 4 ? 'not-allowed' : 'pointer',
              color: adults >= rooms * 4 ? '#FDA4AF' : '#111827',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Row 3: Children */}
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ChildIcon size={20} color="#4B5563" />
            <div>
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9375rem' }}>Children</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>0-17 years</div>
            </div>
          </div>

          {children.length === 0 ? (
            <button
              type="button"
              onClick={handleAddChild}
              style={{
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                color: '#111827',
                borderRadius: 24,
                padding: '6px 16px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              + Add
            </button>
          ) : (
            <button
              type="button"
              disabled={children.length >= 4}
              onClick={handleAddChild}
              style={{
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                color: '#111827',
                borderRadius: 24,
                padding: '4px 12px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: children.length >= 4 ? 'not-allowed' : 'pointer',
                opacity: children.length >= 4 ? 0.5 : 1,
              }}
            >
              + Add more
            </button>
          )}
        </div>

        {/* Children Age Selectors */}
        {children.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {children.map((child, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#F9FAFB',
                  padding: '6px 10px',
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: '0.8125rem', color: '#4B5563' }}>Child {idx + 1} age:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={child.age}
                    onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.8125rem',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      background: '#FFFFFF',
                    }}
                  >
                    <option value={0}>&lt; 1 year</option>
                    {[...Array(17)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} {i + 1 === 1 ? 'year' : 'years'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveChild(idx)}
                    aria-label={`Remove child ${idx + 1}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      padding: '2px 4px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Done button */}
      <button
        type="button"
        onClick={onClose}
        className="btn-primary"
        style={{ width: '100%', marginTop: 8, padding: '10px 0', fontSize: '0.875rem' }}
      >
        Done
      </button>
    </div>
  )
}

