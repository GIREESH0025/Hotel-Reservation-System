import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BRAND_NAME } from '../../api/axios'
import { useState } from 'react'
import { Modal } from './Modal'
import {
  BedDouble,
  LogOut,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  Table2,
  Menu,
  X,
} from 'lucide-react'
import { formatName } from '../../utils/helpers'

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
    { to: '/', label: 'Front of House' },
  ],
  receptionist: [
    { to: '/staff/dashboard', label: 'Dashboard' },
    { to: '/staff/chart', label: 'Tape Chart' },
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
        padding: '9px 14px',
        fontSize: '0.875rem',
        color: isActive ? 'var(--color-primary)' : '#374151',
        textDecoration: 'none',
        fontWeight: isActive ? 700 : 500,
        borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
        marginLeft: '-2px',
        transition: 'all 150ms ease',
        backgroundColor: isActive ? 'var(--color-primary-tint)' : 'transparent',
        borderRadius: '0 6px 6px 0',
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
        width: '42px',
        height: '42px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        color: active ? 'var(--color-primary)' : '#4B5563',
        borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
        transition: 'color 150ms ease, border-color 150ms ease',
      }}
    >
      <Icon size={20} strokeWidth={active ? 2 : 1.75} />
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

/** Modal asking confirmation before logging out */
function LogoutConfirmModal({ isOpen, onClose, onConfirm, isLoggingOut }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isLoggingOut && onClose()}
      title="Confirm Sign Out"
      maxWidth="420px"
    >
      <div style={{ padding: '8px 0 16px', color: '#4B5563', fontSize: '0.9375rem', lineHeight: 1.5 }}>
        Are you sure you want to log out of your account? You will need to sign in again to view your bookings or access your profile.
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoggingOut}
          style={{
            padding: '9px 18px',
            borderRadius: 9999,
            border: '1px solid #D1D5DB',
            background: '#FFFFFF',
            color: '#374151',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoggingOut}
          style={{
            padding: '9px 20px',
            borderRadius: 9999,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: isLoggingOut ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(214, 57, 65, 0.3)',
          }}
        >
          {isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}
        </button>
      </div>
    </Modal>
  )
}

/** Universal Top Navbar matching home section */
export function TopNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      setShowLogoutConfirm(false)
      navigate('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const isCurrent = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const formattedName = formatName(user?.name)

  return (
    <header style={{
      height: '64px',
      borderBottom: '1px solid #E5E7EB',
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
          aria-label="Site navigation"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          className="desktop-nav"
        >
          {/* Rooms / Availability Icon (Always present) */}
          <NavIconButton
            to="/"
            icon={BedDouble}
            title="Rooms & Availability"
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

                {/* Customer Avatar & Name */}
                <Link
                  to="/my/profile"
                  title={`Profile — ${formattedName.full}`}
                  aria-label={`Profile — ${formattedName.full}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    color: isCurrent('/my/profile') ? 'var(--color-primary)' : '#111827',
                    height: '44px',
                    padding: '0 8px',
                    borderBottom: isCurrent('/my/profile') ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent('/my/profile') ? 'var(--color-primary)' : '#111827',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                    }}
                  >
                    {formattedName.initial}
                  </span>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isCurrent('/my/profile') ? 'var(--color-primary)' : '#111827',
                    }}
                    className="desktop-name"
                  >
                    {formattedName.first}
                  </span>
                </Link>

                <NavIconButton
                  onClick={() => setShowLogoutConfirm(true)}
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
                  to="/my/profile"
                  title={`Profile & Settings — ${formattedName.full} (${user.role})`}
                  aria-label={`Profile & Settings — ${formattedName.full}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    color: isCurrent('/my/profile') ? 'var(--color-primary)' : '#111827',
                    height: '44px',
                    padding: '0 8px',
                    borderBottom: isCurrent('/my/profile') ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: user.role === 'admin' ? '#111827' : 'var(--color-primary)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                    }}
                  >
                    {formattedName.initial}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }} className="desktop-name">
                    {formattedName.first}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      backgroundColor: user.role === 'admin' ? '#FEE2E2' : '#EFF6FF',
                      color: user.role === 'admin' ? '#DC2626' : '#2563EB',
                    }}
                  >
                    {user.role}
                  </span>
                </Link>

                <NavIconButton
                  onClick={() => setShowLogoutConfirm(true)}
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
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '6px 10px',
            fontSize: '1rem',
            color: '#111827',
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
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
        className="mobile-nav-menu"
        >
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: '#111827', textDecoration: 'none', padding: '6px 0', fontWeight: 600 }}
          >
            Rooms &amp; Availability
          </Link>

          {user ? (
            <>
              <div style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB', color: '#6B7280', fontSize: '0.8125rem' }}>
                Signed in as <strong>{formattedName.full}</strong> ({user.role})
              </div>
              {user.role === 'customer' ? (
                <>
                  <Link to="/my/bookings" onClick={() => setMobileMenuOpen(false)} style={{ color: '#111827', textDecoration: 'none', padding: '6px 0' }}>
                    My Bookings
                  </Link>
                  <Link to="/my/payments" onClick={() => setMobileMenuOpen(false)} style={{ color: '#111827', textDecoration: 'none', padding: '6px 0' }}>
                    Payment History
                  </Link>
                  <Link to="/my/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', padding: '6px 0' }}>
                    My Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/staff/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ color: '#111827', textDecoration: 'none', padding: '6px 0' }}>
                    Dashboard
                  </Link>
                  <Link to="/staff/chart" onClick={() => setMobileMenuOpen(false)} style={{ color: '#111827', textDecoration: 'none', padding: '6px 0' }}>
                    Tape Chart
                  </Link>
                  <Link to="/staff/reservations" onClick={() => setMobileMenuOpen(false)} style={{ color: '#111827', textDecoration: 'none', padding: '6px 0' }}>
                    Reservations
                  </Link>
                  <Link to="/my/profile" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', padding: '6px 0' }}>
                    My Profile
                  </Link>
                </>
              )}
              <button
                onClick={() => { setMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                style={{
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: '6px 0',
                  color: 'var(--color-primary)',
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
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: '#111827', textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Create account
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </header>
  )
}

/** Layout for Staff / Admin Internal Views with sticky Top Navbar + modern staff sidebar */
export function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const links = ROLE_LINKS[user?.role] || ROLE_LINKS.admin

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      setShowLogoutConfirm(false)
      navigate('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const formatted = formatName(user?.name)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      {/* Universal Top Navbar at the top */}
      <TopNavbar />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Desktop sidebar */}
        <aside style={{
          width: '240px',
          flexShrink: 0,
          borderRight: '1px solid #E5E7EB',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 64,
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
        }}
        className="desktop-sidebar"
        >
          <div style={{ padding: '0 8px 16px 8px', borderBottom: '1px solid #E5E7EB', marginBottom: '16px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: user?.role === 'admin' ? '#DC2626' : '#2563EB',
              marginBottom: '4px',
              fontWeight: 700,
              padding: '2px 8px',
              backgroundColor: user?.role === 'admin' ? '#FEE2E2' : '#EFF6FF',
              borderRadius: '4px',
            }}>
              {user?.role === 'admin' ? 'Administrator' : 'Front Desk'}
            </span>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9375rem', marginTop: '6px', color: '#111827' }}>
              {formatted.full || 'Staff'}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
              {user?.email}
            </span>
          </div>

          <nav aria-label="Staff navigation" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              to="/my/profile"
              style={{
                display: 'block',
                padding: '8px 12px',
                fontSize: '0.875rem',
                color: '#374151',
                textDecoration: 'none',
                fontWeight: 500,
                borderRadius: '6px',
              }}
            >
              Account Profile
            </Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--color-primary)',
                fontWeight: 600,
                borderRadius: '6px',
              }}
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, padding: '32px var(--content-pad)', backgroundColor: 'var(--color-canvas)' }}>
          {children}
        </main>
      </div>

      {/* Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  )
}

/** Standard Public & Customer Layout with sticky Top Navbar + Full Page Body + Footer */
export function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-canvas)' }}>
      {/* Universal Top Navbar at the top */}
      <TopNavbar />

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{
        borderTop: '1px solid #E5E7EB',
        padding: '24px',
        fontSize: '0.8125rem',
        color: '#6B7280',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
      }}>
        <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong style={{ color: '#111827' }}>{BRAND_NAME}</strong> &bull; Historic Harbour Quarter, Mumbai 400001
          </div>
          <div>
            Check-in 14:00 &bull; Check-out 11:00 &bull; Reception: +91 22 2202 0000
          </div>
        </div>
      </footer>
    </div>
  )
}
