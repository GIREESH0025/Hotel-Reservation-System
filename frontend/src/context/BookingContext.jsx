import React, { createContext, useContext, useState, useEffect } from 'react'

const BookingContext = createContext(null)

const STORAGE_KEY = 'hrh_booking_draft'

export function BookingProvider({ children }) {
  const [draft, setDraft] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (draft) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      } else {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('Failed to sync booking draft to sessionStorage:', err)
    }
  }, [draft])

  const updateDraft = (updates) => {
    setDraft((prev) => ({ ...(prev || {}), ...updates }))
  }

  const clearDraft = () => {
    setDraft(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return (
    <BookingContext.Provider value={{ draft, setDraft, updateDraft, clearDraft }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
}
