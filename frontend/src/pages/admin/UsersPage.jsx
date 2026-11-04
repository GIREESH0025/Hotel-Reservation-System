import { useState } from 'react'
import { usersApi } from '../../api/users.api'
import { useFetch } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Pagination } from '../../components/ui/Pagination'
import { SearchBar } from '../../components/ui/SearchBar'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/helpers'

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)
  const { success, error } = useToast()

  // Role edit modal
  const [editingUser, setEditingUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Delete confirm
  const [deletingUser, setDeletingUser] = useState(null)

  const { data, loading, error: fetchError, refetch } = useFetch(
    () => usersApi.list({
      page,
      limit: 15,
      role: roleFilter || undefined,
      search: debouncedSearch || undefined,
    }),
    [page, roleFilter, debouncedSearch]
  )

  const users = data?.data || []
  const totalPages = data?.totalPages || 1

  const openRoleModal = (u) => {
    setEditingUser(u)
    setSelectedRole(u.role)
  }

  const handleSaveRole = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      setSaveLoading(true)
      await usersApi.update(editingUser._id, { role: selectedRole })
      success(`Updated role for ${editingUser.name} to ${selectedRole}.`)
      setEditingUser(null)
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update role.')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingUser) return
    try {
      await usersApi.delete(deletingUser._id)
      success(`User ${deletingUser.name} removed.`)
      setDeletingUser(null)
      refetch()
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete user.')
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'User Name',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.name}</span>
      ),
    },
    { key: 'email', header: 'Email Address', sortable: true },
    {
      key: 'role',
      header: 'Assigned Role',
      sortable: true,
      render: (row) => {
        const colors = {
          admin: 'var(--color-laterite)',
          receptionist: 'var(--color-slate)',
          customer: 'var(--color-stone)',
        }
        return (
          <span style={{
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: colors[row.role] || 'var(--color-ink)',
          }}>
            {row.role}
          </span>
        )
      },
    },
    { key: 'phone', header: 'Telephone', render: (row) => row.phone || '—' },
    { key: 'createdAt', header: 'Registered', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => openRoleModal(row)}
            style={{
              padding: '4px 8px',
              backgroundColor: 'transparent',
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '0.75rem',
            }}
          >
            Change Role
          </button>
          <button
            onClick={() => setDeletingUser(row)}
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
        title="User & Staff Directory"
        subtitle="Control system access privileges, staff roles, and guest identities."
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <SearchBar
            value={searchInput}
            onChange={(val) => { setSearchInput(val); setPage(1); }}
            placeholder="Search users by name or email…"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-paper)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
          }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="receptionist">Receptionist</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {loading && <SkeletonTable rows={8} cols={6} />}

      {fetchError && <ErrorState message={fetchError} onRetry={refetch} />}

      {!loading && !fetchError && (
        <>
          <DataTable
            columns={columns}
            data={users}
            keyField="_id"
            emptyMessage="No user accounts match the search criteria."
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}

      {/* Role Change Modal */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`Change Role: ${editingUser?.name}`}
        maxWidth="400px"
      >
        <form onSubmit={handleSaveRole}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-stone)', marginBottom: '16px' }}>
            Email: <strong>{editingUser?.email}</strong>
          </p>

          <Select
            label="Assigned System Role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={[
              { value: 'admin', label: 'Admin (Full system privileges)' },
              { value: 'receptionist', label: 'Receptionist (Front desk operations)' },
              { value: 'customer', label: 'Customer (Online booking patron)' },
            ]}
            required
            style={{ marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saveLoading}>
              Update Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Revoke User Account"
        message={`Are you certain you wish to delete the account for ${deletingUser?.name} (${deletingUser?.email})?`}
        confirmLabel="Yes, Delete Account"
        danger
      />
    </div>
  )
}

