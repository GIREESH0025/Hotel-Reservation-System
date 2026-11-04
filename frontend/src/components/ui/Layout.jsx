import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BRAND_NAME } from '../../api/axios'
import { useState } from 'react'

const ROLE_LINKS = {
  admin: [
    { to: '/staff/dashboard', label: 'Dashboard' },
    { to: '/staff/chart', label: 'Tape Chart' },
    { to: '/staff/reservations', label: 'Reservations' },
    { to: '/staff/guests', label: 'Guests' },
    { to: '/staff/payments', label: 'Payments' },
    { to: '/admin/rooms', label: 'Rooms' },
    { to: '/admin/room-types', label: 'Room Types' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  receptionist: [
    { to: '/staff/dashboard', label: 'Dashboard' },
    { to: '/staff/chart', label: 'Tape Chart' },
    { to: '/staff/reservations', label: 'Reservations' },
    { to: '/staff/guests', label: 'Guests' },
    { to: '/staff/payments', label: 'Payments' },
  ],
  customer: [
    { to: '/', label: 'Find a Room' },
    { to: '/my/reservations', label: 'My Reservations' },
    { to: '/my/profile', label: 'My Profile' },
  ],
}

function NavLink({ to, label, currentPath }) {
  const isActive = currentPath === to || currentPath.startsWith(to + '/')
  return (
    <Link
      to={to}
      style={{
        display: 'block',
        padding: '6px 12px',
        fontSize: '0.875rem',
        color: isActive ? 'var(--color-laterite)' : 'var(--color-ink)',
        textDecoration: 'none',
        fontWeight: isActive ? 600 : 400,
        borderLeft: isActive ? '2px solid var(--color-laterite)' : '2px solid transparent',
        marginLeft: '-2px',
        transition: 'color var(--transition)',
      }}
    >
      {label}
    </Link>
  )
}

export function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = ROLE_LINKS[user?.role] || ROLE_LINKS.customer

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarContent = (
    <>
      <div style={{ padding: '0 0 16px 0', borderBottom: 'var(--border)', marginBottom: '16px' }}>
        <span style={{
          display: 'block',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-stone)',
          marginBottom: '4px',
          fontWeight: 600,
        }}>
          {user?.role}
        </span>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{user?.name}</span>
      </div>
      <nav aria-label="Main navigation">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} label={l.label} currentPath={location.pathname} />
        ))}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '6px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--color-stone)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        flexShrink: 0,
        borderRight: 'var(--border)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}
      className="desktop-sidebar"
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.0625rem',
            color: 'var(--color-ink)',
            lineHeight: 1.2,
            display: 'block',
          }}>
            {BRAND_NAME}
          </span>
        </Link>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px var(--content-pad)' }}>
        {/* Mobile header */}
        <div style={{
          display: 'none',
          marginBottom: '24px',
        }}
        className="mobile-header"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>{BRAND_NAME}</span>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
          </div>
          {mobileOpen && (
            <div style={{ marginTop: '16px', borderTop: 'var(--border)', paddingTop: '16px' }}>
              {sidebarContent}
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  )
}

/**
 * PublicLayout — For login, register, and the home/availability page.
 */
export function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        borderBottom: 'var(--border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            color: 'var(--color-ink)',
          }}>
            {BRAND_NAME}
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: 'var(--color-ink)', textDecoration: 'none' }}>Sign in</Link>
          <Link to="/register" style={{ color: 'var(--color-laterite)', textDecoration: 'none', fontWeight: 600 }}>Create account</Link>
        </nav>
      </header>
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <footer style={{
        borderTop: 'var(--border)',
        padding: '16px 24px',
        fontSize: '0.8125rem',
        color: 'var(--color-stone)',
        textAlign: 'center',
      }}>
        Demo project, not a real hotel.
      </footer>
    </div>
  )
}

