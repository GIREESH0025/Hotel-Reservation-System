import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { guestsApi } from '../../api/guests.api'
import { useToast } from '../../context/ToastContext'
import { PageHeader } from '../../components/ui/PageHeader'
import { Field } from '../../components/ui/Field'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'

export default function GuestDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [idProof, setIdProof] = useState('')

  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        setInitialLoading(true)
        const res = await guestsApi.get(id)
        const g = res.data?.data
        if (g) {
          setFullName(g.fullName || '')
          setPhone(g.phone || '')
          setEmail(g.email || '')
          setIdProof(g.idProof || '')
        }
      } catch (err) {
        setFetchError('Unable to load guest record.')
      } finally {
        setInitialLoading(false)
      }
    }
    fetchGuest()
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (!phone.trim()) errs.phone = 'Phone number is required'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    try {
      setSaving(true)
      await guestsApi.update(id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        idProof: idProof.trim() || undefined,
      })
      success('Guest particulars updated successfully.')
      navigate('/staff/guests')
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update guest.')
    } finally {
      setSaving(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="page-container" style={{ maxWidth: '480px' }}>
        <Skeleton height="36px" style={{ marginBottom: '24px' }} />
        <Skeleton height="200px" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="page-container" style={{ maxWidth: '480px' }}>
        <ErrorState message={fetchError} />
        <div style={{ marginTop: '16px' }}>
          <Link to="/staff/guests">&larr; Return to guest directory</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ maxWidth: '480px' }}>
      <PageHeader
        title="Guest Particulars"
        subtitle={`Review and amend record for ${fullName}.`}
      />

      <div style={{ border: 'var(--border)', padding: '24px', backgroundColor: 'var(--color-paper)', borderRadius: 'var(--radius)' }}>
        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
            required
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            required
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="ID Proof / Identity Document"
            type="text"
            value={idProof}
            onChange={(e) => setIdProof(e.target.value)}
            placeholder="e.g. Passport, Driver License, National ID"
            style={{ marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
            <Link to="/staff/guests" style={{ color: 'var(--color-stone)', textDecoration: 'none', fontSize: '0.875rem' }}>
              Cancel
            </Link>
            <Button type="submit" variant="primary" loading={saving}>
              Save Amendments
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
