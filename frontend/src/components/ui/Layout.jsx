import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BRAND_NAME } from '../../api/axios'
import { useState } from 'react'

const ROLE_LINKS = {
  admin: [
    { to: '/staff/dashboard', label: 'Dashboard' },
    { to: '/staff/chart', label: 'Front Desk (Tape Chart)' },
    { to: '/staff/reservations', label: 'Reservations' },
    { to: '/staff/guests', label: 'Guests' },
    { to: '/staff/payments', label: 'Payments' },
    { to: '/admin/rooms', label: 'Rooms' },
    { to: '/admin/room-types', label: 'Room Types' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/', label: 'Front of House' },
  ],
  receptionist: [
    { to: '/staff/dashboard', label: 'Dashboard' },
    { to: '/staff/chart', label: 'Front Desk (Tape Chart)' },
    { to: '/staff/reservations', label: 'Reservations' },
    { to: '/staff/guests', label: 'Guests' },
    { to: '/staff/payments', label: 'Payments' },
    { to: '/', label: 'Front of House' },
  ],
  customer: [
    { to: '/', label: 'Find a Room' },
    { to: '/my/bookings', label: 'My Bookings' },
    { to: '/my/profile', label: 'My Profile' },
  ],
}

function NavLink({ to, label, currentPath, onClick }) {
  const isActive = currentPath === to || (to !== '/' && currentPath.startsWith(to))
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: 'block',
        padding: '8px 12px',
        fontSize: '0.875rem',
        color: isActive ? 'var(--color-laterite)' : 'var(--color-ink)',
        textDecoration: 'none',
        fontWeight: isActive ? 600 : 400,
        borderLeft: isActive ? '2px solid var(--color-laterite)' : '2px solid transparent',
        marginLeft: '-2px',
        transition: 'color var(--transition)',
        backgroundColor: isActive ? 'rgba(164, 68, 42, 0.05)' : 'transparent',
        borderRadius: '0 var(--radius) var(--radius) 0',
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
          display: 'inline-block',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-stone)',
          marginBottom: '4px',
          fontWeight: 600,
          padding: '2px 6px',
          backgroundColor: 'var(--color-stone-bg)',
          borderRadius: 'var(--radius)',
        }}>
          {user?.role || 'Guest'}
        </span>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9375rem', marginTop: '4px' }}>
          {user?.name || 'Patron'}
        </span>
        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-stone)', marginTop: '2px' }}>
          {user?.email}
        </span>
      </div>
      <nav aria-label="Main navigation" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            label={l.label}
            currentPath={location.pathname}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>
      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: 'var(--border)' }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: 'var(--color-stone)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 500,
            borderRadius: 'var(--radius)',
          }}
        >
          &larr; Sign out
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-paper)' }}>
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
        backgroundColor: 'var(--color-paper)',
      }}
      className="desktop-sidebar"
      >
        <Link to="/" style={{ textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            color: 'var(--color-ink)',
            lineHeight: 1.2,
            display: 'block',
          }}>
            {BRAND_NAME}
          </span>
          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-stone)' }}>
            Est. 1928 &bull; Register
          </span>
        </Link>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px var(--content-pad)' }}>
        {/* Mobile header bar */}
        <div style={{
          display: 'none',
          marginBottom: '24px',
          borderBottom: 'var(--border)',
          paddingBottom: '12px',
        }}
        className="mobile-header"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Link to="/" style={{ textDecoration: 'none', color: 'var(--color-ink)' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem' }}>{BRAND_NAME}</span>
              </Link>
              <span style={{ display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-stone)' }}>
                {user?.role ? `${user.role} console` : 'Guest'}
              </span>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: 'none',
                border: 'var(--border)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                padding: '6px 10px',
                fontSize: '1rem',
                color: 'var(--color-ink)',
              }}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? '✕' : '☰ Menu'}
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
 * PublicLayout — For public home, booking page, login, and registration.
 * Driven directly by AuthContext so logged-in users see their account and role navigation.
 */
export function PublicLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isCurrent = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-paper)' }}>
      <header style={{
        borderBottom: 'var(--border)',
        padding: '16px 24px',
        backgroundColor: 'var(--color-paper)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Brand Logo */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              color: 'var(--color-ink)',
              display: 'block',
              lineHeight: 1.1,
            }}>
              {BRAND_NAME}
            </span>
            <span style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-stone)',
              display: 'block',
              marginTop: '2px',
            }}>
              Boutique Lodgings &amp; Fine Chambers
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            aria-label="Public site navigation"
            style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.875rem' }}
            className="desktop-nav"
          >
            <Link
              to="/"
              style={{
                color: isCurrent('/') ? 'var(--color-laterite)' : 'var(--color-ink)',
                textDecoration: 'none',
                fontWeight: isCurrent('/') ? 600 : 400,
                borderBottom: isCurrent('/') ? '2px solid var(--color-laterite)' : '2px solid transparent',
                paddingBottom: '2px',
              }}
            >
              Availability &amp; Rooms
            </Link>

            {user ? (
              /* Logged In State */
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {user.role === 'customer' ? (
                  <>
                    <Link
                      to="/my/bookings"
                      style={{
                        color: isCurrent('/my/bookings') || isCurrent('/my/reservations') ? 'var(--color-laterite)' : 'var(--color-ink)',
                        textDecoration: 'none',
                        fontWeight: isCurrent('/my/bookings') || isCurrent('/my/reservations') ? 600 : 400,
                        borderBottom: (isCurrent('/my/bookings') || isCurrent('/my/reservations')) ? '2px solid var(--color-laterite)' : '2px solid transparent',
                        paddingBottom: '2px',
                      }}
                    >
                      My Bookings
                    </Link>
                    <Link
                      to="/my/profile"
                      style={{
                        color: isCurrent('/my/profile') ? 'var(--color-laterite)' : 'var(--color-ink)',
                        textDecoration: 'none',
                        fontWeight: isCurrent('/my/profile') ? 600 : 400,
                        borderBottom: isCurrent('/my/profile') ? '2px solid var(--color-laterite)' : '2px solid transparent',
                        paddingBottom: '2px',
                      }}
                    >
                      Profile
                    </Link>
                  </>
                ) : (
                  /* Staff or Admin */
                  <>
                    <Link
                      to="/staff/chart"
                      style={{
                        color: isCurrent('/staff/chart') ? 'var(--color-laterite)' : 'var(--color-ink)',
                        textDecoration: 'none',
                        fontWeight: isCurrent('/staff/chart') ? 600 : 400,
                      }}
                    >
                      Tape Chart
                    </Link>
                    <Link
                      to="/staff/dashboard"
                      style={{
                        color: isCurrent('/staff/dashboard') ? 'var(--color-laterite)' : 'var(--color-ink)',
                        textDecoration: 'none',
                        fontWeight: isCurrent('/staff/dashboard') ? 600 : 400,
                      }}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/staff/reservations"
                      style={{
                        color: isCurrent('/staff/reservations') ? 'var(--color-laterite)' : 'var(--color-ink)',
                        textDecoration: 'none',
                        fontWeight: isCurrent('/staff/reservations') ? 600 : 400,
                      }}
                    >
                      Reservations
                    </Link>
                  </>
                )}

                {/* User indicator & Sign Out button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderLeft: '1px solid var(--color-rule)',
                  paddingLeft: '16px',
                  marginLeft: '4px',
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem' }}>
                      {user.name}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--color-stone)' }}>
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      border: 'var(--border)',
                      backgroundColor: 'transparent',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontFamily: 'var(--font-ui)',
                      color: 'var(--color-stone)',
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              /* Logged Out State */
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Link
                  to="/login"
                  style={{
                    color: isCurrent('/login') ? 'var(--color-laterite)' : 'var(--color-ink)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: 'var(--color-laterite)',
                    color: 'var(--color-paper)',
                    textDecoration: 'none',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius)',
                    transition: 'background var(--transition)',
                  }}
                >
                  Create account
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '1rem',
              color: 'var(--color-ink)',
            }}
            className="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: 'var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          className="mobile-nav-menu"
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}
            >
              Availability &amp; Rooms
            </Link>

            {user ? (
              <>
                <div style={{ padding: '8px 0', borderBottom: '1px dotted var(--color-rule)', color: 'var(--color-stone)', fontSize: '0.8125rem' }}>
                  Signed in as <strong>{user.name}</strong> ({user.role})
                </div>
                {user.role === 'customer' ? (
                  <>
                    <Link to="/my/bookings" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      My Bookings
                    </Link>
                    <Link to="/my/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/staff/chart" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      Tape Chart
                    </Link>
                    <Link to="/staff/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      Dashboard
                    </Link>
                    <Link to="/staff/reservations" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      Reservations
                    </Link>
                  </>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '6px 0',
                    color: 'var(--color-laterite)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none' }}>
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-laterite)', fontWeight: 600, textDecoration: 'none' }}>
                  Create account
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{
        borderTop: 'var(--border)',
        padding: '24px',
        fontSize: '0.8125rem',
        color: 'var(--color-stone)',
        textAlign: 'center',
        backgroundColor: 'var(--color-paper)',
      }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>{BRAND_NAME}</strong> &bull; Historic Harbour Quarter, Mumbai 400001
          </div>
          <div>
            Check-in 14:00 &bull; Check-out 11:00 &bull; Concierge: +91 22 4910 8800
          </div>
          <div style={{ fontStyle: 'italic' }}>
            Academic MERN Demonstration Project
          </div>
        </div>
      </footer>
    </div>
  )
}
