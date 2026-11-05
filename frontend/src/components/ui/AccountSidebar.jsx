import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  User as UserIcon,
  CalendarCheck,
  CreditCard,
  BedDouble,
  LayoutDashboard,
  Table2,
} from 'lucide-react'

export function AccountSidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const pathname = location.pathname

  const isStaff = user?.role === 'admin' || user?.role === 'receptionist'

  const links = isStaff
    ? [
        { to: '/my/profile', label: 'Profile & Settings', icon: UserIcon },
        { to: '/staff/dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
        { to: '/staff/chart', label: 'Tape Chart', icon: Table2 },
        { to: '/staff/reservations', label: 'Reservations', icon: CalendarCheck },
        { to: '/', label: 'Browse Rooms', icon: BedDouble },
      ]
    : [
        { to: '/my/profile', label: 'Profile & Settings', icon: UserIcon },
        { to: '/my/bookings', label: 'My Bookings', icon: CalendarCheck },
        { to: '/my/payments', label: 'Payment History', icon: CreditCard },
        { to: '/', label: 'Browse Rooms', icon: BedDouble },
      ]

  return (
    <aside
      style={{
        width: '230px',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: '16px',
        padding: '12px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        height: 'fit-content',
        position: 'sticky',
        top: '84px',
      }}
      className="account-sidebar"
    >
      {links.map((link) => {
        const isActive =
          link.to === '/'
            ? pathname === '/'
            : pathname === link.to || (link.to !== '/my/profile' && pathname.startsWith(link.to))
        const Icon = link.icon

        return (
          <Link
            key={link.to}
            to={link.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#FFFFFF' : '#374151',
              backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
          >
            <Icon
              size={18}
              strokeWidth={isActive ? 2.25 : 1.75}
              color={isActive ? '#FFFFFF' : '#6B7280'}
            />
            <span>{link.label}</span>
          </Link>
        )
      })}
    </aside>
  )
}
