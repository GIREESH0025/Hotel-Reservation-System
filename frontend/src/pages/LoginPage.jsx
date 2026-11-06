import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { validate } from '../utils/helpers'

export default function LoginPage() {
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
    : '/'

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

      // Guard: Hotel staff and administrators must sign in through the Admin Portal (/admin)
      if (user.role === 'admin' || user.role === 'receptionist') {
        await logout()
        setServerError('Access restricted: Hotel staff and administrators must sign in through the Admin Portal at /admin.')
        return
      }

      success(`Welcome back, ${user.name}`)

      // Redirect based on intended destination
      if (from !== '/' && from !== '/login' && from !== '/admin') {
        navigate(from, { replace: true })
      } else {
        // Customer default landing: home page with search bar
        navigate('/', { replace: true })
      }
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
    <div style={{ maxWidth: '440px', margin: '48px auto', padding: '0 16px' }}>
      <div
        style={{
          border: '1px solid #E5E7EB',
          padding: '36px 32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '8px', color: '#111827', fontWeight: 800 }}>
          Guest Sign In
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '24px' }}>
          Enter your credentials to access your guest reservations and profile.
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
              borderRadius: 'var(--radius)',
              marginBottom: '20px',
            }}
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
            }}
            error={errors.email}
            required
            autoComplete="email"
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
            style={{ width: '100%', marginBottom: '16px' }}
          >
            Sign In
          </Button>

          <p style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Register here
            </Link>
          </p>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', fontSize: '0.8125rem', color: '#6B7280' }}>
          <p style={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}>Demo Guest Account:</p>
          <p>Email: <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#111827' }}>rahul@example.com</code></p>
          <p style={{ marginTop: '3px' }}>Password: <code style={{ backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px', color: '#111827' }}>Guest@1234</code></p>
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #E5E7EB' }}>
            <Link to="/admin" style={{ fontSize: '0.75rem', color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>
              Hotel Staff or Administrator? Go to Staff &amp; Admin Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

