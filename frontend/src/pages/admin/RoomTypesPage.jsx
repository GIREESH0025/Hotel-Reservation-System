import { useState } from 'react'
import { roomTypesApi } from '../../api/roomTypes.api'
import { useFetch } from '../../hooks/useFetch'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { Button } from '../../components/ui/Button'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { Field } from '../../components/ui/Field'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../utils/helpers'

export default function RoomTypesPage() {
  const [page, setPage] = useState(1)
  const { success, error } = useToast()

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [baseRate, setBaseRate] = useState(2500)
  const [capacity, setCapacity] = useState(2)
  const [amenitiesInput, setAmenitiesInput] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  // Delete confirm
  const [deletingType, setDeletingType] = useState(null)

  const { data, loading, error: fetchError, refetch } = useFetch(
    () => roomTypesApi.list({ page, limit: 15 }),
    [page]
  )

  const roomTypes = data?.data || []
  const totalPages = data?.totalPages || 1

  const openCreateModal = () => {
    setEditingType(null)
    setName('')
    setDescription('')
    setBaseRate(2500)
    setCapacity(2)
    setAmenitiesInput('Wi-Fi, Air Conditioning, TV')
    setModalOpen(true)
  }

  const openEditModal = (rt) => {
    setEditingType(rt)
    setName(rt.name)
    setDescription(rt.description || '')
    setBaseRate(rt.baseRate)
    setCapacity(rt.capacity)
    setAmenitiesInput(Array.isArray(rt.amenities) ? rt.amenities.join(', ') : '')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      error('Room type name is required.')
      return
    }

    const amenities = amenitiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const payload = {
      name: name.trim(),
      description: description.trim(),
      baseRate: parseFloat(baseRate) || 0,
      capacity: parseInt(capacity, 10) || 1,
      amenities,
    }

    try {
      setModalLoading(true)
      if (editingType) {
        await roomTypesApi.update(editingType._id, payload)
        success(`Chamber type "${name}" updated.`)
      } else {
        await roomTypesApi.create(payload)
        success(`Chamber type "${name}" registered.`)
      }
      setModalOpen(false)
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save room type.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingType) return
    try {
      await roomTypesApi.delete(deletingType._id)
      success(`Chamber type "${deletingType.name}" deleted.`)
      setDeletingType(null)
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete room type.')
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem' }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'baseRate',
      header: 'Standard Nightly Rate',
      numeric: true,
      sortable: true,
      render: (row) => formatINR(row.baseRate),
    },
    {
      key: 'capacity',
      header: 'Max Adults',
      numeric: true,
      sortable: true,
    },
    {
      key: 'amenities',
      header: 'Included Amenities',
      render: (row) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {row.amenities?.map((a) => (
            <span
              key={a}
              style={{
                fontSize: '0.6875rem',
                padding: '2px 6px',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
              }}
            >
              {a}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => openEditModal(row)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => setDeletingType(row)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="page-container">
      <PageHeader
        title="Chamber Types & Categories"
        subtitle="Manage room classes, standard night tariffs, capacity ceilings, and provided appointments."
      >
        <Button variant="primary" onClick={openCreateModal}>
          + New Chamber Type
        </Button>
      </PageHeader>

      {loading && <SkeletonTable rows={5} cols={5} />}

      {fetchError && <ErrorState message={fetchError} onRetry={refetch} />}

      {!loading && !fetchError && (
        <>
          <DataTable
            columns={columns}
            data={roomTypes}
            keyField="_id"
            emptyMessage="No chamber types configured."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingType ? `Edit ${editingType.name}` : 'New Chamber Category'}
        maxWidth="500px"
      >
        <form onSubmit={handleSave} noValidate>
          <Field
            label="Type Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Deluxe Suite, Superior Garden"
            required
            style={{ marginBottom: '16px' }}
          />

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="description" style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '4px' }}>
              Description
            </label>
            <textarea
              id="description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of the chamber's layout, furnishings, and view…"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-paper)',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.9375rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <Field
              label="Base Nightly Rate (INR)"
              type="number"
              min="0"
              step="100"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              required
            />

            <Field
              label="Adult Capacity"
              type="number"
              min="1"
              max="10"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
          </div>

          <Field
            label="Amenities (comma-separated)"
            type="text"
            value={amenitiesInput}
            onChange={(e) => setAmenitiesInput(e.target.value)}
            placeholder="Wi-Fi, Air Conditioning, Jacuzzi, Balcony"
            style={{ marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingType)}
        onClose={() => setDeletingType(null)}
        onConfirm={handleDelete}
        title="Delete Chamber Type"
        message={`Are you sure you wish to delete "${deletingType?.name}"? Any rooms assigned to this type may become unclassified.`}
        confirmLabel="Yes, Delete"
        danger
      />
    </div>
  )
}
