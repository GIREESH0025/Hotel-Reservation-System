import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { validate } from '../../utils/helpers'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const { login, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from
    ? (typeof location.state.from === 'string'
        ? location.state.from
        : `${location.state.from.pathname || '/'}${location.state.from.search || ''}`)
    : '/staff/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    // Client-side validation
    const errs = {}
    const emailErr = validate.email(email)
    if (emailErr) errs.email = emailErr
    if (!password) errs.password = 'Password is required'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    try {
      setLoading(true)
      const user = await login(email, password)

      // Only Admin and Receptionist (staff) are permitted in this portal
      if (user.role === 'customer') {
        await logout()
        setServerError('Access denied: Guest accounts cannot sign in through the Admin Portal. Please use the Guest Sign In page.')
        return
      }

      success(`Welcome to Management Portal, ${user.name}`)

      // Redirect to staff destination
      const destination = from && from !== '/' && from !== '/login' && from !== '/admin'
        ? from
        : '/staff/dashboard'

      navigate(destination, { replace: true })
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
        'The email address or password you entered is incorrect. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '460px', margin: '48px auto', padding: '0 16px' }}>
      <div
        style={{
          border: '1px solid #E5E7EB',
          borderTop: '4px solid #111827',
          padding: '36px 32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.6875rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#DC2626',
              backgroundColor: '#FEE2E2',
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            <ShieldCheck size={13} />
            Staff &amp; Admin Portal
          </span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', marginBottom: '8px', color: '#111827', fontWeight: 800 }}>
          Management Sign In
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '24px', lineHeight: 1.5 }}>
          Authorized hotel staff and administrators only. Access to reservations, tape chart, guest records, and system settings.
        </p>

        {serverError && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              border: '1px solid var(--color-error)',
              backgroundColor: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              fontSize: '0.875rem',
              borderRadius: '8px',
              marginBottom: '20px',
              lineHeight: 1.4,
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Staff email address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
            }}
            error={errors.email}
            required
            autoComplete="email"
            placeholder="e.g. admin@harbourrow.com"
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
            }}
            error={errors.password}
            required
            autoComplete="current-password"
            style={{ marginBottom: '24px' }}
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            style={{
              width: '100%',
              marginBottom: '16px',
              backgroundColor: '#111827',
              borderColor: '#111827',
            }}
          >
            Sign In to Staff Portal
          </Button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', fontSize: '0.8125rem', color: '#6B7280' }}>
          <p style={{ fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Authorized Staff Credentials:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem' }}>
            <p>
              <strong>Admin:</strong> <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#111827' }}>admin@harbourrow.com</code> / <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#111827' }}>Admin@1234</code>
            </p>
            <p>
              <strong>Front Desk:</strong> <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#111827' }}>priya@harbourrow.com</code> / <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#111827' }}>Staff@1234</code>
            </p>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '0.75rem', color: '#6B7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={12} /> Hotel Homepage
            </Link>
            <Link to="/login" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Guest Sign In &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
