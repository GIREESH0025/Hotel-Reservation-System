import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/ui/Skeleton'

/**
 * ProtectedRoute — Guards a route behind authentication + role check.
 * - If auth is loading: show loading skeleton
 * - If not authenticated: redirect to /login
 * - If authenticated but wrong role: redirect to /403
 * - Otherwise: render children
 */
export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <Skeleton height="40px" style={{ marginBottom: '16px' }} />
        <Skeleton height="20px" style={{ marginBottom: '12px', width: '60%' }} />
        <Skeleton height="20px" style={{ marginBottom: '12px', width: '80%' }} />
        <Skeleton height="20px" style={{ width: '40%' }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />
  }

  return children
}
