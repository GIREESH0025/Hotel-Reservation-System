import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useFetch — Generic data fetching hook.
 * Returns { data, loading, error, refetch }.
 * Cancels ongoing requests when component unmounts.
 *
 * @param {Function} fetchFn — An async function that returns the data
 * @param {Array} deps — Dependencies array (like useEffect)
 */
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMounted = useRef(true)
  const counter = useRef(0)

  const execute = useCallback(async () => {
    if (!isMounted.current) return
    const id = ++counter.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      if (isMounted.current && id === counter.current) {
        const payload = result?.data ?? result
        if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
          // If it is a paginated list or collection response (has total/totalPages/page or data is Array)
          if ('total' in payload || 'totalPages' in payload || Array.isArray(payload.data)) {
            setData(payload)
          } else {
            // Single resource: unwrap to payload.data
            setData(payload.data)
          }
        } else {
          setData(payload)
        }
        setError(null)
      }
    } catch (err) {
      if (isMounted.current && id === counter.current) {
        setError(err?.response?.data?.message || err.message || 'An error occurred.')
        setData(null)
      }
    } finally {
      if (isMounted.current && id === counter.current) {
        setLoading(false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    isMounted.current = true
    execute()
    return () => { isMounted.current = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute])

  return { data, loading, error, refetch: execute }
}

