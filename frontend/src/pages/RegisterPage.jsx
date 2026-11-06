import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Field } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { validate } from '../utils/helpers'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    // Client-side validation
    const errs = {}
    const nameErr = validate.name(name)
    if (nameErr) errs.name = nameErr
    const emailErr = validate.email(email)
    if (emailErr) errs.email = emailErr
    const passErr = validate.password(password)
    if (passErr) errs.password = passErr

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    try {
      setLoading(true)
      const user = await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() })
      success(`Welcome to Harbour Row Hotel, ${user.name}! Your account has been created.`)
      navigate('/my/reservations', { replace: true })
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const fieldErrors = {}
        err.response.data.errors.forEach((e) => {
          if (e.field) fieldErrors[e.field] = e.message
        })
        setErrors(fieldErrors)
      }
      setServerError(
        err.response?.data?.message ||
        'Registration failed. Please check the details and try again.'
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
          padding: '36px 32px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        }}
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '8px', color: '#111827', fontWeight: 800 }}>
          Create Account
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '24px' }}>
          Register as a guest to book rooms and track reservations.
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

        <form onSubmit={handleSubmit} noValidate autoComplete="off">
          <Field
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
            }}
            error={errors.name}
            required
            autoComplete="name"
            style={{ marginBottom: '16px' }}
          />

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
            label="Phone number (optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            autoComplete="tel"
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
            hint="Minimum 8 characters"
            required
            autoComplete="new-password"
            style={{ marginBottom: '24px' }}
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            style={{ width: '100%', marginBottom: '16px' }}
          >
            Create Account
          </Button>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-laterite)', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

