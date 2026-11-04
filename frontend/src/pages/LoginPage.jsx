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

  const { login } = useAuth()
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
      success(`Welcome back, ${user.name}`)

      // Redirect based on role or intended destination
      if (from !== '/' && from !== '/login') {
        navigate(from, { replace: true })
      } else if (user.role === 'admin' || user.role === 'receptionist') {
        navigate('/staff/dashboard', { replace: true })
      } else {
        navigate('/my/bookings', { replace: true })
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
      <div style={{ border: 'var(--border)', padding: '32px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '8px' }}>
          Sign In
        </h1>
        <p style={{ color: 'var(--color-stone)', fontSize: '0.875rem', marginBottom: '24px' }}>
          Enter your credentials to access your hotel account.
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

          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', textAlign: 'center' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-laterite)', fontWeight: 500 }}>
              Register here
            </Link>
          </p>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: 'var(--border)', fontSize: '0.75rem', color: 'var(--color-stone)' }}>
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>Demo Credentials:</p>
          <p>Admin: admin@harbourrow.com / Admin@1234</p>
          <p>Staff: priya@harbourrow.com / Staff@1234</p>
          <p>Customer: rahul@example.com / Guest@1234</p>
        </div>
      </div>
    </div>
  )
}

