import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../../api/users.api'
import { reservationsApi } from '../../api/reservations.api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTitle } from '../../hooks/useTitle'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { validate, formatDate, formatName } from '../../utils/helpers'

export default function MyProfilePage() {
  useTitle('My Profile')
  const { user } = useAuth()
  const { success, error } = useToast()

  // Profile fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [memberSince, setMemberSince] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Stay statistics
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 })

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        setInitialLoading(true)
        const [userRes, resvRes] = await Promise.all([
          usersApi.me(),
          reservationsApi.list({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        ])

        const u = userRes.data?.data
        if (u) {
          setName(u.name || '')
          setPhone(u.phone || '')
          setMemberSince(u.createdAt)
        }

        const resvs = resvRes.data?.data || []
        let upcoming = 0
        let completed = 0

        resvs.forEach((r) => {
          if (['pending', 'confirmed'].includes(r.status)) upcoming++
          if (r.status === 'checked_out') completed++
        })

        setStats({ total: resvs.length, upcoming, completed })
      } catch (err) {
        error('Failed to load profile details.')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchProfileAndStats()
  }, [])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()

    const errs = {}
    const nameErr = validate.name(name)
    if (nameErr) errs.name = nameErr

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    try {
      setLoading(true)
      await usersApi.update(user.id || user._id, { name: name.trim(), phone: phone.trim() })
      success('Profile updated successfully.')
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    const errs = {}
    if (!currentPassword) errs.currentPassword = 'Enter your current password'
    if (!newPassword) {
      errs.newPassword = 'Enter a new password'
    } else if (newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters'
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'New passwords do not match'
    }

    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs)
      return
    }
    setPasswordErrors({})

    try {
      setPasswordLoading(true)
      await usersApi.changePassword({ currentPassword, newPassword })
      success('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const formattedName = formatName(name || user?.name)
  const isCustomer = user?.role === 'customer'
  const isAdmin = user?.role === 'admin'
  const isReceptionist = user?.role === 'receptionist'

  if (initialLoading) {
    return (
      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '40px 24px' }}>
        <Skeleton height="36px" style={{ marginBottom: '24px', width: '40%' }} />
        <Skeleton height="140px" style={{ marginBottom: '24px', borderRadius: 16 }} />
        <Skeleton height="260px" style={{ borderRadius: 16 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', padding: '40px 24px' }}>
      {/* ── Page Header & Sub-Nav Pills ──────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>
          My Profile
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#6B7280' }}>
          Manage your personal details, account security, and stay history.
        </p>

        {/* Quick Navigation Pills matching user role */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            Profile &amp; Settings
          </span>

          {isCustomer && (
            <>
              <Link
                to="/my/bookings"
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  transition: 'background 150ms ease',
                }}
              >
                My Bookings
              </Link>
              <Link
                to="/my/payments"
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  transition: 'background 150ms ease',
                }}
              >
                Payment History
              </Link>
              <Link
                to="/"
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                Browse Rooms
              </Link>
            </>
          )}

          {(isAdmin || isReceptionist) && (
            <>
              <Link
                to="/staff/dashboard"
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                Staff Dashboard
              </Link>
              <Link
                to="/staff/chart"
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                Tape Chart
              </Link>
              <Link
                to="/staff/reservations"
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  color: '#374151',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                Reservations
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/rooms"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    color: '#374151',
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  Admin Portal
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── User Identity Hero Card ──────────────────────────────────────── */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E5E7EB',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: isAdmin ? '#111827' : 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: '1.5rem',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {formattedName.initial}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                {formattedName.full}
              </h2>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  backgroundColor: isAdmin ? '#FEE2E2' : isReceptionist ? '#EFF6FF' : '#ECFDF5',
                  color: isAdmin ? '#DC2626' : isReceptionist ? '#2563EB' : '#059669',
                }}
              >
                {isAdmin ? 'Administrator' : isReceptionist ? 'Front Desk Receptionist' : 'Guest Patron'}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '4px 0 0 0' }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>
            Member since {memberSince ? formatDate(memberSince) : 'Recent'}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#059669',
              marginTop: 4,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            Active Account
          </span>
        </div>
      </div>

      {/* ── Customer Stay Statistics ─────────────────────────────────────── */}
      {isCustomer && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280' }}>
              Total Bookings
            </span>
            <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#111827', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {stats.total}
            </p>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669' }}>
              Upcoming Stays
            </span>
            <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#059669', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {stats.upcoming}
            </p>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: 16,
              padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280' }}>
              Completed Stays
            </span>
            <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#4B5563', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
              {stats.completed}
            </p>
          </div>
        </div>
      )}

      {/* ── Settings Forms: Personal Details & Password ───────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 24,
        }}
      >
        {/* Card 1: Personal Details */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Personal Details
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '4px 0 0 0' }}>
              Update your contact information used for check-in and reservations.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                Email Address
              </label>
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{user?.email}</span>
                <span style={{ fontSize: '0.6875rem', color: '#9CA3AF', fontWeight: 500 }}>
                  Primary ID
                </span>
              </div>
            </div>

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
              style={{ marginBottom: 16 }}
            />

            <Field
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              placeholder="+91 98765 43210"
              style={{ marginBottom: 24 }}
            />

            <Button type="submit" variant="primary" loading={loading} style={{ width: '100%' }}>
              Save Personal Details
            </Button>
          </form>
        </div>

        {/* Card 2: Security & Password */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: 16,
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Change Password
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '4px 0 0 0' }}>
              Ensure your account credentials are secure and up to date.
            </p>
          </div>

          <form onSubmit={handleChangePassword} noValidate>
            <Field
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value)
                if (passwordErrors.currentPassword) setPasswordErrors((p) => ({ ...p, currentPassword: '' }))
              }}
              error={passwordErrors.currentPassword}
              required
              autoComplete="current-password"
              style={{ marginBottom: 16 }}
            />

            <Field
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (passwordErrors.newPassword) setPasswordErrors((p) => ({ ...p, newPassword: '' }))
              }}
              error={passwordErrors.newPassword}
              helper="Minimum 8 characters"
              required
              autoComplete="new-password"
              style={{ marginBottom: 16 }}
            />

            <Field
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (passwordErrors.confirmPassword) setPasswordErrors((p) => ({ ...p, confirmPassword: '' }))
              }}
              error={passwordErrors.confirmPassword}
              required
              autoComplete="new-password"
              style={{ marginBottom: 24 }}
            />

            <Button type="submit" variant="secondary" loading={passwordLoading} style={{ width: '100%' }}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
