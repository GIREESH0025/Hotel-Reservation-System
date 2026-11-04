import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { guestsApi } from '../../api/guests.api'
import { useFetch } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { SearchBar } from '../../components/ui/SearchBar'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Field } from '../../components/ui/Field'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'

export default function GuestsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const navigate = useNavigate()
  const { success, error } = useToast()

  // New guest modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [idProof, setIdProof] = useState('')
  const [createErrors, setCreateErrors] = useState({})
  const [createLoading, setCreateLoading] = useState(false)

  const { data, loading, error: fetchError, refetch } = useFetch(
    () => guestsApi.list({ page, limit: 15, search: debouncedSearch || undefined }),
    [page, debouncedSearch]
  )

  const guests = data?.data || []
  const totalPages = data?.totalPages || 1

  const handleCreateGuest = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (!phone.trim()) errs.phone = 'Phone number is required'

    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs)
      return
    }
    setCreateErrors({})

    try {
      setCreateLoading(true)
      await guestsApi.create({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        idProof: idProof.trim() || undefined,
      })
      success('Guest record created.')
      setShowCreateModal(false)
      setFullName('')
      setPhone('')
      setEmail('')
      setIdProof('')
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create guest.')
    } finally {
      setCreateLoading(false)
    }
  }

  const columns = [
    {
      key: 'fullName',
      header: 'Full Name',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--color-laterite)' }}>
          {row.fullName}
        </span>
      ),
    },
    { key: 'phone', header: 'Phone Number', sortable: true },
    { key: 'email', header: 'Email Address', sortable: true, render: (row) => row.email || '—' },
    { key: 'idProof', header: 'Identification / Proof', render: (row) => row.idProof || '—' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <span style={{ color: 'var(--color-laterite)', fontSize: '0.8125rem' }}>Edit &rarr;</span>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Guest Directory"
        subtitle="Roster of all registered patrons and contact records."
      >
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + New Guest
        </Button>
      </PageHeader>

      <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
        <SearchBar
          value={searchInput}
          onChange={(val) => { setSearchInput(val); setPage(1); }}
          placeholder="Search by name, email, or telephone…"
        />
      </div>

      {loading && <SkeletonTable rows={8} cols={5} />}

      {fetchError && <ErrorState message={fetchError} onRetry={refetch} />}

      {!loading && !fetchError && (
        <>
          <DataTable
            columns={columns}
            data={guests}
            keyField="_id"
            onRowClick={(row) => navigate(`/staff/guests/${row._id}`)}
            emptyMessage="No guest records located."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Create Guest Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Register New Guest"
        maxWidth="480px"
      >
        <form onSubmit={handleCreateGuest} noValidate>
          <Field
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={createErrors.fullName}
            required
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={createErrors.phone}
            required
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Email Address (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Identity Proof / Document (optional)"
            type="text"
            placeholder="e.g. Passport: P1234567, Aadhar: 1234..."
            value={idProof}
            onChange={(e) => setIdProof(e.target.value)}
            style={{ marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={createLoading}>
              Save Guest
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

