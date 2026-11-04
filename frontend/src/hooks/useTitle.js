import { useEffect } from 'react'
import { BRAND_NAME } from '../api/axios'

/**
 * useTitle — Sets document.title dynamically per route.
 * @param {string} title
 */
export function useTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${BRAND_NAME} — ${title}` : BRAND_NAME
    return () => {
      document.title = prev
    }
  }, [title])
}
