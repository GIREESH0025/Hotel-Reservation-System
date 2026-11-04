import { useState, useEffect } from 'react'

/**
 * useDebounce — Returns a debounced version of the value.
 * Useful for search inputs to avoid firing on every keystroke.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

