import { useRef, useState } from 'react'
import { useDebounce } from '../../hooks/useDebounce'

/**
 * SearchBar — Debounced search input.
 * Calls onSearch with the debounced value.
 */
export function SearchBar({ value, onChange, placeholder = 'Search…', debounceMs = 400 }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          display: 'block',
          width: '100%',
          padding: '8px 12px 8px 36px',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9375rem',
          color: 'var(--color-ink)',
          backgroundColor: 'var(--color-paper)',
          border: 'var(--border)',
          borderRadius: 'var(--radius)',
          outline: 'none',
        }}
        aria-label={placeholder}
      />
      <span style={{
        position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--color-stone)',
        fontSize: '0.875rem',
        pointerEvents: 'none',
      }}>
        ⌕
      </span>
    </div>
  )
}

