import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'

export default function ForbiddenPage() {
  const { user } = useAuth()

  const destination = user?.role === 'admin' || user?.role === 'receptionist'
    ? '/staff/dashboard'
    : user ? '/my/reservations' : '/login'

  return (
    <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-error)', margin: 0 }}>
        403
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', margin: '8px 0 16px' }}>
        Access Restricted
      </h1>
      <p style={{ color: 'var(--color-stone)', lineHeight: 1.6, marginBottom: '24px' }}>
        You do not possess the required staff permissions to access this administrative register.
      </p>
      <Link to={destination}>
        <Button variant="secondary">Return to Permitted Area</Button>
      </Link>
    </div>
  )
}

