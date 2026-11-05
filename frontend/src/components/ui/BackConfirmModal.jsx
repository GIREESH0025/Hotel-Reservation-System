import React, { useEffect } from 'react'

/**
 * Back confirmation modal matching reference UI (Attachment #5).
 * "You are about to book your stay, do you really want to go back?"
 * Buttons: "Go back" (secondary outlined pill) vs "Stay" (primary red pill).
 */
export default function BackConfirmModal({ isOpen, onStay, onGoBack }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onStay()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onStay])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onStay}
    >
      <div
        className="animate-popover"
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: '36px 32px 32px',
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.4,
            marginBottom: 28,
            maxWidth: 320,
            margin: '0 auto 28px',
          }}
        >
          You are about to book your stay, do you really want to go back?
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Go back (outlined pill) */}
          <button
            type="button"
            onClick={onGoBack}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 9999,
              border: '1.5px solid #111827',
              background: '#FFFFFF',
              color: '#111827',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Go back
          </button>

          {/* Stay (red filled pill) */}
          <button
            type="button"
            onClick={onStay}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 9999,
              border: 'none',
              background: '#D63941',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            Stay
          </button>
        </div>
      </div>
    </div>
  )
}
