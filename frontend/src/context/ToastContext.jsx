import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]) // max 5 toasts
    timers.current[id] = setTimeout(() => remove(id), duration)
  }, [remove])

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast])
  const error = useCallback((msg) => addToast(msg, 'error', 6000), [addToast])
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast])

  return (
    <ToastContext.Provider value={{ success, error, info, addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null

  const styles = {
    container: {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 'var(--z-toast)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '380px',
    },
    toast: (type) => ({
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '12px 16px',
      border: '1px solid',
      borderRadius: '2px',
      fontSize: '0.875rem',
      lineHeight: '1.4',
      fontFamily: 'var(--font-ui)',
      backgroundColor: type === 'success' ? 'var(--color-moss-bg)'
        : type === 'error' ? 'var(--color-error-bg)'
        : 'var(--color-slate-bg)',
      borderColor: type === 'success' ? 'var(--color-moss)'
        : type === 'error' ? 'var(--color-error)'
        : 'var(--color-slate)',
      color: type === 'success' ? 'var(--color-moss)'
        : type === 'error' ? 'var(--color-error)'
        : 'var(--color-slate)',
    }),
    close: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      lineHeight: 1,
      color: 'inherit',
      flexShrink: 0,
      padding: '0',
      opacity: 0.6,
    },
  }

  return (
    <div style={styles.container} role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} style={styles.toast(t.type)}>
          <span>{t.message}</span>
          <button style={styles.close} onClick={() => onRemove(t.id)} aria-label="Dismiss notification">×</button>
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      addToast: () => {},
    }
  }
  return ctx
}

