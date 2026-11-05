import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BRAND_NAME } from '../../api/axios'
import { useState } from 'react'
import {
  BedDouble,
  LogIn,
  LogOut,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Table2,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react'
import { formatName } from '../../utils/helpers'

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
    { to: '/my/payments', label: 'Payment History' },
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

function NavIconButton({ to, icon: Icon, title, active, onClick }) {
  const content = (
    <span
      style={{
        width: '44px',
        height: '44px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        color: active ? 'var(--color-laterite)' : 'var(--color-ink)',
        borderBottom: active ? '2px solid var(--color-laterite)' : '2px solid transparent',
        transition: 'color var(--transition)',
      }}
    >
      <Icon size={20} strokeWidth={1.5} />
    </span>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
        }}
      >
        {content}
      </button>
    )
  }

  return (
    <Link to={to} title={title} aria-label={title} style={{ textDecoration: 'none', display: 'inline-flex' }}>
      {content}
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

  const formatted = formatName(user?.name)

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
          {formatted.full || 'Guest'}
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
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: 'var(--border)' }}>
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
            fontWeight: 600,
          }}>
            {BRAND_NAME}
          </span>
          <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-stone)' }}>
            Register &bull; Management
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
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600 }}>{BRAND_NAME}</span>
              </Link>
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
              aria-label="Toggle navigation"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile slide-down drawer */}
          {mobileOpen && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: 'var(--border)',
            }}>
              {sidebarContent}
            </div>
          )}
        </div>

        {children}
      </main>
    </div>
  )
}

export function PublicLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isCurrent = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const formattedName = formatName(user?.name)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      {/* 64px Modern Marketplace Navbar */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 'var(--max-width)',
          height: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Wordmark Only */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '1.25rem',
              color: '#111827',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}>
              {BRAND_NAME}
            </span>
          </Link>

          {/* Desktop Right Cluster: Lucide Symbols */}
          <nav
            aria-label="Public site navigation"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            className="desktop-nav"
          >
            {/* Rooms / Availability Icon (Always present) */}
            <NavIconButton
              to="/"
              icon={BedDouble}
              title="Rooms & Rates"
              active={isCurrent('/') && location.pathname === '/'}
            />

            {user ? (
              user.role === 'customer' ? (
                /* Customer Cluster */
                <>
                  <NavIconButton
                    to="/my/bookings"
                    icon={CalendarCheck}
                    title="My Bookings"
                    active={isCurrent('/my/bookings') || isCurrent('/my/reservations')}
                  />
                  <NavIconButton
                    to="/my/payments"
                    icon={CreditCard}
                    title="Payment History"
                    active={isCurrent('/my/payments')}
                  />

                  {/* Customer Avatar & Name (NO role badge) */}
                  <Link
                    to="/my/profile"
                    title={`Patron Profile — ${formattedName.full}`}
                    aria-label={`Patron Profile — ${formattedName.full}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      color: isCurrent('/my/profile') ? 'var(--color-laterite)' : 'var(--color-ink)',
                      height: '44px',
                      padding: '0 8px',
                      borderBottom: isCurrent('/my/profile') ? '2px solid var(--color-laterite)' : '2px solid transparent',
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid var(--color-rule)',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {formattedName.initial}
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                      className="desktop-name"
                    >
                      {formattedName.first}
                    </span>
                  </Link>

                  <NavIconButton
                    onClick={handleLogout}
                    icon={LogOut}
                    title="Sign Out"
                  />
                </>
              ) : (
                /* Receptionist / Admin Cluster */
                <>
                  <NavIconButton
                    to="/staff/dashboard"
                    icon={LayoutDashboard}
                    title="Front Desk Dashboard"
                    active={isCurrent('/staff/dashboard')}
                  />
                  <NavIconButton
                    to="/staff/chart"
                    icon={Table2}
                    title="Room Tape Chart"
                    active={isCurrent('/staff/chart')}
                  />
                  <NavIconButton
                    to="/staff/reservations"
                    icon={CalendarCheck}
                    title="Reservations List"
                    active={isCurrent('/staff/reservations')}
                  />
                  <Link
                    to="/staff/dashboard"
                    title={`Staff Portal (${user.role})`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      color: 'var(--color-ink)',
                      height: '44px',
                      padding: '0 8px',
                    }}
                  >
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: '1px solid var(--color-rule)',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--color-ink)',
                      }}
                    >
                      {formattedName.initial}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }} className="desktop-name">
                      {formattedName.first}
                    </span>
                  </Link>
                  <NavIconButton
                    onClick={handleLogout}
                    icon={LogOut}
                    title="Sign Out"
                  />
                </>
              )
            ) : (
              /* Logged Out Cluster */
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  to="/login"
                  style={{
                    color: '#111827',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    padding: '8px 16px',
                    borderRadius: 9999,
                    border: '1px solid #D1D5DB',
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    padding: '8px 18px',
                    borderRadius: 9999,
                    boxShadow: '0 2px 6px rgba(214, 57, 65, 0.3)',
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
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div style={{
            padding: '16px 24px',
            borderBottom: 'var(--border)',
            backgroundColor: 'var(--color-paper)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
          className="mobile-nav-menu"
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0', fontWeight: 500 }}
            >
              Rooms &amp; Availability
            </Link>

            {user ? (
              <>
                <div style={{ padding: '8px 0', borderBottom: '1px dotted var(--color-rule)', color: 'var(--color-stone)', fontSize: '0.8125rem' }}>
                  Signed in as <strong>{formattedName.full}</strong>
                </div>
                {user.role === 'customer' ? (
                  <>
                    <Link to="/my/bookings" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      My Bookings
                    </Link>
                    <Link to="/my/payments" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      Payment History
                    </Link>
                    <Link to="/my/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      My Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/staff/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      Dashboard
                    </Link>
                    <Link to="/staff/chart" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-ink)', textDecoration: 'none', padding: '6px 0' }}>
                      Tape Chart
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
                    fontWeight: 600,
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
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
            Check-in 14:00 &bull; Check-out 11:00 &bull; Reception: +91 22 2202 0000
          </div>
          <div style={{ fontStyle: 'italic', color: 'var(--color-stone)' }}>
            Demo project, not a real hotel.
          </div>
        </div>
      </footer>
    </div>
  )
}
