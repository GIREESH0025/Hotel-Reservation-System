import React from 'react'
import { formatINR } from '../../utils/helpers'

/**
 * Price Range Filter with dual min/max inputs and slider.
 */
export default function RangeSlider({
  min = 1000,
  max = 20000,
  currentMin = 1000,
  currentMax = 20000,
  onChange,
}) {
  const handleMinChange = (e) => {
    const val = Number(e.target.value)
    if (val <= currentMax) {
      onChange(val, currentMax)
    }
  }

  const handleMaxChange = (e) => {
    const val = Number(e.target.value)
    if (val >= currentMin) {
      onChange(currentMin, val)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Range inputs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>
            Min price
          </label>
          <div
            style={{
              padding: '6px 10px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              background: '#F9FAFB',
            }}
          >
            {formatINR(currentMin)}
          </div>
        </div>

        <span style={{ color: '#9CA3AF', marginTop: 18 }}>–</span>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: 4 }}>
            Max price
          </label>
          <div
            style={{
              padding: '6px 10px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 600,
              background: '#F9FAFB',
            }}
          >
            {formatINR(currentMax)}
          </div>
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={500}
          value={currentMin}
          onChange={handleMinChange}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={500}
          value={currentMax}
          onChange={handleMaxChange}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
        />
      </div>
    </div>
  )
}
