import { useState, useEffect } from 'react'
import { usersApi } from '../../api/users.api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { validate } from '../../utils/helpers'

export default function MyProfilePage() {
  const { user } = useAuth()
  const { success, error } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setInitialLoading(true)
        const res = await usersApi.me()
        const u = res.data?.data
        if (u) {
          setName(u.name || '')
          setPhone(u.phone || '')
        }
      } catch (err) {
        error('Failed to load profile details.')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchMe()
  }, [])

  const handleSubmit = async (e) => {
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

  if (initialLoading) {
    return (
      <div className="page-container" style={{ maxWidth: '480px' }}>
        <Skeleton height="36px" style={{ marginBottom: '24px' }} />
        <Skeleton height="150px" />
      </div>
    )
  }

  return (
    <div className="page-container" style={{ maxWidth: '480px' }}>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal details and contact telephone number."
      />

      <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
              Email Address
            </span>
            <p style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-stone)' }}>
              {user?.email} (Cannot be altered)
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-stone)' }}>
              Role
            </span>
            <p style={{ textTransform: 'capitalize', fontWeight: 600, marginTop: '2px' }}>
              {user?.role}
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
            style={{ marginBottom: '24px' }}
          />

          <Button type="submit" variant="primary" loading={loading} style={{ width: '100%' }}>
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
