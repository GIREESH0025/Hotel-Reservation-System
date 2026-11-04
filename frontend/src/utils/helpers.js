/**
 * Normalises and formats a name in Title Case and extracts parts.
 * @param {string} name
 * @returns {{ full: string, first: string, initial: string }}
 */
export function formatName(name) {
  if (!name || typeof name !== 'string') return { full: '', first: '', initial: 'G' }
  const cleaned = name.trim().replace(/\s+/g, ' ')
  const titleCased = cleaned
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const first = titleCased.split(' ')[0] || ''
  const initial = first.charAt(0).toUpperCase() || 'G'
  return { full: titleCased, first, initial }
}

/**
 * Formats date into editorial style: e.g. "Tue 4 Nov 2026"
 */
export function formatDateEditorial(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const isDateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date.trim())
  const tzOpt = isDateOnly ? { timeZone: 'UTC' } : { timeZone: 'Asia/Kolkata' }
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', ...tzOpt }).format(d)
  const day = new Intl.DateTimeFormat('en-IN', { day: 'numeric', ...tzOpt }).format(d)
  const month = new Intl.DateTimeFormat('en-IN', { month: 'short', ...tzOpt }).format(d)
  const year = new Intl.DateTimeFormat('en-IN', { year: 'numeric', ...tzOpt }).format(d)
  return `${weekday} ${day} ${month} ${year}`
}

/**
 * Formats a number as Indian Rupees.
 * @param {number} amount
 * @returns {string} e.g. "₹2,500.00"
 */
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0)
}

/**
 * Formats a date as a readable string.
 * @param {string|Date} date
 * @param {string} [format='short'] — 'short' | 'long' | 'numeric'
 */
export function formatDate(date, format = 'short') {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'

  // If the string is a date-only YYYY-MM-DD or ISO UTC string, formatting with timeZone: 'UTC'
  // prevents timezone shifting (e.g. 12 Nov becoming 11 Nov in UTC- or late-night IST).
  const isDateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z?)?$/.test(date.trim())

  const options = {
    short: { day: '2-digit', month: 'short', year: 'numeric', ...(isDateOnly ? { timeZone: 'UTC' } : {}) },
    long: { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', ...(isDateOnly ? { timeZone: 'UTC' } : {}) },
    numeric: { day: '2-digit', month: '2-digit', year: 'numeric', ...(isDateOnly ? { timeZone: 'UTC' } : {}) },
  }
  return d.toLocaleDateString('en-IN', options[format] || options.short)
}

/**
 * Returns today's date as a YYYY-MM-DD string (for input[type=date] min attribute).
 */
export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Returns a date string N days from today as YYYY-MM-DD.
 */
export function daysFromTodayStr(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

/**
 * Computes the number of nights between two date strings.
 */
export function computeNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  const diff = new Date(checkOut) - new Date(checkIn)
  return Math.max(0, Math.round(diff / 86400000))
}

/**
 * Extracts a user-friendly error message from an Axios error.
 */
export function getErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Returns the status colour token for a reservation status.
 */
export function statusColor(status) {
  const map = {
    pending:     { color: 'var(--color-ochre)',  bg: 'var(--color-ochre-bg)' },
    confirmed:   { color: 'var(--color-moss)',   bg: 'var(--color-moss-bg)' },
    checked_in:  { color: 'var(--color-slate)',  bg: 'var(--color-slate-bg)' },
    checked_out: { color: 'var(--color-ink)',    bg: 'var(--color-rule)' },
    cancelled:   { color: 'var(--color-stone)',  bg: 'var(--color-stone-bg)' },
    no_show:     { color: 'var(--color-stone)',  bg: 'var(--color-stone-bg)' },
    paid:        { color: 'var(--color-moss)',   bg: 'var(--color-moss-bg)' },
    refunded:    { color: 'var(--color-ochre)',  bg: 'var(--color-ochre-bg)' },
    active:      { color: 'var(--color-moss)',   bg: 'var(--color-moss-bg)' },
    maintenance: { color: 'var(--color-ochre)',  bg: 'var(--color-ochre-bg)' },
  }
  return map[status] || { color: 'var(--color-stone)', bg: 'var(--color-stone-bg)' }
}

/**
 * Client-side validation helpers (mirror server rules)
 */
export const validate = {
  email: (v) => !v ? 'Email is required' : !/^\S+@\S+\.\S+$/.test(v) ? 'Enter a valid email address' : '',
  password: (v) => !v ? 'Password is required' : v.length < 8 ? 'Password must be at least 8 characters' : '',
  name: (v) => !v ? 'Name is required' : v.trim().length < 2 ? 'Name must be at least 2 characters' : '',
  required: (v, field = 'This field') => !v && v !== 0 ? `${field} is required` : '',
  positiveNumber: (v, field = 'Amount') => !v ? `${field} is required` : isNaN(v) || Number(v) <= 0 ? `${field} must be a positive number` : '',
  dateRange: (checkIn, checkOut) => {
    if (!checkIn) return { checkIn: 'Check-in date is required', checkOut: '' }
    if (!checkOut) return { checkIn: '', checkOut: 'Check-out date is required' }
    const ci = new Date(checkIn), co = new Date(checkOut)
    if (co <= ci) return { checkIn: '', checkOut: 'Check-out must be after check-in' }
    const nights = Math.round((co - ci) / 86400000)
    if (nights > 30) return { checkIn: '', checkOut: 'Stay cannot exceed 30 nights' }
    return { checkIn: '', checkOut: '' }
  },
}

