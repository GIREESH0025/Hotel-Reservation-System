import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const RefreshContext = createContext(null)

export function RefreshProvider({ children }) {
  const [refreshTick, setRefreshTick] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1)
    try {
      localStorage.setItem('hrh_last_data_update', Date.now().toString())
    } catch {
      // Ignore storage errors in restricted private browsing
    }
  }, [])

  // Synchronize across browser tabs whenever admin modifies room rates, inventory, or bookings
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'hrh_last_data_update') {
        setRefreshTick((t) => t + 1)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshTick, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  const ctx = useContext(RefreshContext)
  if (!ctx) {
    // Graceful fallback if used outside provider
    return { refreshTick: 0, triggerRefresh: () => {} }
  }
  return ctx
}

