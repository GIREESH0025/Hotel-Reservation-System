import { useState } from 'react'
import { roomsApi } from '../../api/rooms.api'
import { roomTypesApi } from '../../api/roomTypes.api'
import { useFetch } from '../../hooks/useFetch'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { Button } from '../../components/ui/Button'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { Field } from '../../components/ui/Field'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../utils/helpers'

export default function RoomsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const { success, error } = useToast()

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [number, setNumber] = useState('')
  const [floor, setFloor] = useState(1)
  const [roomType, setRoomType] = useState('')
  const [rateOverride, setRateOverride] = useState('')
  const [status, setStatus] = useState('active')
  const [modalLoading, setModalLoading] = useState(false)

  // Delete confirm state
  const [deletingRoom, setDeletingRoom] = useState(null)

  // Fetch rooms
  const { data, loading, error: fetchError, refetch } = useFetch(
    () => roomsApi.list({ page, limit: 15, status: statusFilter || undefined }),
    [page, statusFilter]
  )

  // Fetch room types for selection
  const { data: rtData } = useFetch(() => roomTypesApi.list({ limit: 50 }), [])
  const roomTypes = rtData?.data || []

  const rooms = data?.data || []
  const totalPages = data?.totalPages || 1

  const openCreateModal = () => {
    setEditingRoom(null)
    setNumber('')
    setFloor(1)
    setRoomType(roomTypes[0]?._id || '')
    setRateOverride('')
    setStatus('active')
    setModalOpen(true)
  }

  const openEditModal = (r) => {
    setEditingRoom(r)
    setNumber(r.number)
    setFloor(r.floor)
    setRoomType(r.roomType?._id || r.roomType)
    setRateOverride(r.rateOverride != null ? String(r.rateOverride) : '')
    setStatus(r.status)
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!number.trim()) {
      error('Chamber number is required.')
      return
    }
    if (!roomType) {
      error('Chamber type is required.')
      return
    }

    const payload = {
      number: number.trim(),
      floor: parseInt(floor, 10) || 1,
      roomType,
      rateOverride: rateOverride ? parseFloat(rateOverride) : null,
      status,
    }

    try {
      setModalLoading(true)
      if (editingRoom) {
        await roomsApi.update(editingRoom._id, payload)
        success(`Chamber ${number} updated successfully.`)
      } else {
        await roomsApi.create(payload)
        success(`Chamber ${number} registered.`)
      }
      setModalOpen(false)
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save chamber details.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleMaintenance = async (r) => {
    const nextStatus = r.status === 'active' ? 'maintenance' : 'active'
    try {
      await roomsApi.update(r._id, { status: nextStatus })
      success(`Chamber ${r.number} status changed to ${nextStatus}.`)
      refetch()
    } catch (err) {
      error('Failed to change chamber status.')
    }
  }

  const handleDelete = async () => {
    if (!deletingRoom) return
    try {
      await roomsApi.delete(deletingRoom._id)
      success(`Chamber ${deletingRoom.number} removed.`)
      setDeletingRoom(null)
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete chamber.')
    }
  }

  const columns = [
    {
      key: 'number',
      header: 'Chamber Number',
      sortable: true,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600 }}>
          {row.number}
        </span>
      ),
    },
    { key: 'floor', header: 'Floor', numeric: true, sortable: true },
    {
      key: 'roomType',
      header: 'Chamber Type',
      render: (row) => row.roomType?.name || '—',
    },
    {
      key: 'rate',
      header: 'Nightly Rate',
      numeric: true,
      render: (row) => {
        const rate = row.rateOverride != null ? row.rateOverride : row.roomType?.baseRate
        return (
          <span>
            {formatINR(rate)}
            {row.rateOverride != null && (
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-ochre)', marginLeft: '4px' }}>
                [Override]
              </span>
            )}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleToggleMaintenance(row)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              color: row.status === 'active' ? 'var(--color-stone)' : 'var(--color-moss)',
            }}
          >
            {row.status === 'active' ? 'Set Maint' : 'Set Active'}
          </button>
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
            onClick={() => setDeletingRoom(row)}
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
        title="Chambers & Rooms Master"
        subtitle="Maintain hotel room inventory, rates, and operational maintenance status."
      >
        <Button variant="primary" onClick={openCreateModal}>
          + Register Chamber
        </Button>
      </PageHeader>

      <div style={{ marginBottom: '20px' }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-paper)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading && <SkeletonTable rows={8} cols={6} />}

      {fetchError && <ErrorState message={fetchError} onRetry={refetch} />}

      {!loading && !fetchError && (
        <>
          <DataTable
            columns={columns}
            data={rooms}
            keyField="_id"
            emptyMessage="No chambers registered."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? `Edit Chamber ${editingRoom.number}` : 'Register New Chamber'}
        maxWidth="480px"
      >
        <form onSubmit={handleSave} noValidate>
          <Field
            label="Chamber Number"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="e.g. 101, 204, 701"
            required
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Floor Level"
            type="number"
            min="0"
            max="50"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            required
            style={{ marginBottom: '16px' }}
          />

          <Select
            label="Chamber Type"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            options={roomTypes.map((rt) => ({ value: rt._id, label: `${rt.name} (${formatINR(rt.baseRate)}/night)` }))}
            required
            style={{ marginBottom: '16px' }}
          />

          <Field
            label="Rate Override (INR, optional)"
            type="number"
            step="100"
            min="0"
            placeholder="Leave empty to use base rate"
            value={rateOverride}
            onChange={(e) => setRateOverride(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'active', label: 'Active (Available for booking)' },
              { value: 'maintenance', label: 'Maintenance (Blocked from booking)' },
            ]}
            required
            style={{ marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={modalLoading}>
              Save Chamber
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingRoom)}
        onClose={() => setDeletingRoom(null)}
        onConfirm={handleDelete}
        title="Delete Chamber Record"
        message={`Are you certain you wish to delete Chamber ${deletingRoom?.number}? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        danger
      />
    </div>
  )
}

