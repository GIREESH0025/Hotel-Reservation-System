import { createContext, useContext, useState, useCallback } from 'react'

const RefreshContext = createContext(null)

export function RefreshProvider({ children }) {
  const [refreshTick, setRefreshTick] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1)
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

