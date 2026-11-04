import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { AppLayout, PublicLayout } from './components/ui/Layout'

// Lazy-loaded pages (reduces initial bundle)
import { lazy, Suspense } from 'react'
import { Skeleton } from './components/ui/Skeleton'

const AvailabilityPage = lazy(() => import('./pages/AvailabilityPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const BookPage = lazy(() => import('./pages/BookPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'))

// Customer
const MyReservationsPage = lazy(() => import('./pages/customer/MyReservationsPage'))
const MyReservationDetailPage = lazy(() => import('./pages/customer/MyReservationDetailPage'))
const MyProfilePage = lazy(() => import('./pages/customer/MyProfilePage'))

// Staff
const DashboardPage = lazy(() => import('./pages/staff/DashboardPage'))
const TapeChartPage = lazy(() => import('./pages/staff/TapeChartPage'))
const ReservationsListPage = lazy(() => import('./pages/staff/ReservationsListPage'))
const NewReservationPage = lazy(() => import('./pages/staff/NewReservationPage'))
const ReservationDetailPage = lazy(() => import('./pages/staff/ReservationDetailPage'))
const GuestsPage = lazy(() => import('./pages/staff/GuestsPage'))
const GuestDetailPage = lazy(() => import('./pages/staff/GuestDetailPage'))
const PaymentsPage = lazy(() => import('./pages/staff/PaymentsPage'))

// Admin
const RoomsPage = lazy(() => import('./pages/admin/RoomsPage'))
const RoomTypesPage = lazy(() => import('./pages/admin/RoomTypesPage'))
const UsersPage = lazy(() => import('./pages/admin/UsersPage'))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'))

function PageFallback() {
  return (
    <div style={{ padding: '48px 24px' }}>
      <Skeleton height="40px" style={{ marginBottom: '16px', width: '30%' }} />
      <Skeleton height="20px" style={{ marginBottom: '12px' }} />
      <Skeleton height="20px" style={{ marginBottom: '12px', width: '70%' }} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLayout><AvailabilityPage /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />
            <Route
              path="/book"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <PublicLayout><BookPage /></PublicLayout>
                </ProtectedRoute>
              }
            />

            {/* Customer routes */}
            <Route
              path="/my/reservations"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <AppLayout><MyReservationsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/reservations/:id"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <AppLayout><MyReservationDetailPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/profile"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <AppLayout><MyProfilePage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Staff routes (admin + receptionist) */}
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/chart"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><TapeChartPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/reservations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><ReservationsListPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/reservations/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><NewReservationPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/reservations/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><ReservationDetailPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/guests"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><GuestsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/guests/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><GuestDetailPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/payments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <AppLayout><PaymentsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin-only routes */}
            <Route
              path="/admin/rooms"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><RoomsPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/room-types"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><RoomTypesPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><UsersPage /></AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><ReportsPage /></AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Error pages */}
            <Route path="/403" element={<PublicLayout><ForbiddenPage /></PublicLayout>} />
            <Route path="/404" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
            <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  )
}

