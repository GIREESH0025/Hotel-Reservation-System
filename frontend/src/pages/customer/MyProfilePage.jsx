import { useState, useEffect } from 'react'
import { usersApi } from '../../api/users.api'
import { reservationsApi } from '../../api/reservations.api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTitle } from '../../hooks/useTitle'
import { PageHeader } from '../../components/ui/PageHeader'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { validate, formatDate } from '../../utils/helpers'

export default function MyProfilePage() {
  useTitle('Patron Profile')
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
        const now = new Date()
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

  if (initialLoading) {
    return (
      <div className="page-container" style={{ maxWidth: '640px' }}>
        <Skeleton height="36px" style={{ marginBottom: '24px' }} />
        <Skeleton height="180px" style={{ marginBottom: '24px' }} />
        <Skeleton height="220px" />
      </div>
    )
  }

  return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      <PageHeader
        title="Patron Profile"
        subtitle="Manage your guest credentials, security credentials, and stay history."
      />

      {/* Stay Statistics Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        border: 'var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        backgroundColor: 'var(--color-paper)',
        marginBottom: '28px',
        textAlign: 'center',
      }}>
        <div>
          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)' }}>
            Total Bookings
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
            {stats.total}
          </p>
        </div>
        <div style={{ borderLeft: '1px solid var(--color-rule)', borderRight: '1px solid var(--color-rule)' }}>
          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-moss)' }}>
            Upcoming Stays
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: '4px', fontVariantNumeric: 'tabular-nums', color: 'var(--color-moss)' }}>
            {stats.upcoming}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-stone)' }}>
            Completed Stays
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Personal Information Form */}
      <div style={{
        border: 'var(--border)',
        padding: '24px',
        backgroundColor: 'var(--color-paper)',
        borderRadius: 'var(--radius)',
        marginBottom: '28px',
      }}>
        <div style={{ borderBottom: '1px solid var(--color-rule)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Personal Information</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
            Patron since {memberSince ? formatDate(memberSince) : 'Recent'} &bull; Registered as {user?.role}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
              Email Address
            </span>
            <p style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-stone)' }}>
              {user?.email} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>(Fixed account identifier)</span>
            </p>
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
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            placeholder="+91 98765 43210"
            style={{ marginBottom: '24px' }}
          />

          <Button type="submit" variant="primary" loading={loading}>
            Save Personal Details
          </Button>
        </form>
      </div>

      {/* Security & Password Change */}
      <div style={{
        border: 'var(--border)',
        padding: '24px',
        backgroundColor: 'var(--color-paper)',
        borderRadius: 'var(--radius)',
      }}>
        <div style={{ borderBottom: '1px solid var(--color-rule)', paddingBottom: '12px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Change Password</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
            Keep your hotel folio credentials confidential and protected.
          </span>
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
            style={{ marginBottom: '16px' }}
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
            style={{ marginBottom: '16px' }}
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
            style={{ marginBottom: '24px' }}
          />

          <Button type="submit" variant="secondary" loading={passwordLoading}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  )
}
