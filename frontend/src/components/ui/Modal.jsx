/**
 * Modal — Simple bordered overlay panel. No glass, no blur.
 * Traps focus within. Closes on Escape key.
 */
import { useEffect, useRef } from 'react'

export function Modal({ isOpen, onClose, title, children, maxWidth = '560px' }) {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement
    contentRef.current?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previouslyFocused?.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 27, 24, 0.5)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 16px',
        overflowY: 'auto',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        style={{
          backgroundColor: 'var(--color-paper)',
          border: 'var(--border)',
          borderRadius: 'var(--radius)',
          width: '100%',
          maxWidth,
          outline: 'none',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: 'var(--border)',
        }}>
          <h4 id="modal-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.125rem' }}>
            {title}
          </h4>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: 'var(--color-stone)',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * ConfirmDialog — Simple confirmation dialog.
 */
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="420px">
      <p style={{ marginBottom: '24px', color: 'var(--color-ink)', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            border: 'var(--border)',
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          style={{
            padding: '8px 16px',
            border: 'none',
            backgroundColor: danger ? 'var(--color-error)' : 'var(--color-laterite)',
            color: 'var(--color-paper)',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            fontWeight: 500,
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

