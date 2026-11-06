import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomsApi } from '../../api/rooms.api'
import { reservationsApi } from '../../api/reservations.api'
import { useFetch } from '../../hooks/useFetch'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatINR, formatDate, statusColor } from '../../utils/helpers'
import { useRefresh } from '../../context/RefreshContext'

export default function TapeChartPage() {
  const navigate = useNavigate()
  const { refreshTick } = useRefresh()
  const [selectedReservation, setSelectedReservation] = useState(null)

  // Generate next 14 days starting from today (00:00:00)
  const days = useMemo(() => {
    const list = []
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    for (let i = 0; i < 14; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      list.push(d)
    }
    return list
  }, [])

  const startDateStr = days[0].toISOString().split('T')[0]
  const endDateStr = days[13].toISOString().split('T')[0]

  // Fetch all rooms
  const { data: roomsData, loading: roomsLoading, error: roomsError, refetch: refetchRooms } = useFetch(
    () => roomsApi.list({ limit: 100, sort: 'number' }),
    [refreshTick]
  )

  // Fetch reservations covering the 14-day window
  const { data: resData, loading: resLoading, error: resError, refetch: refetchRes } = useFetch(
    () => reservationsApi.list({
      limit: 100,
      checkInTo: endDateStr,
      status: 'pending,confirmed,checked_in', // active statuses
    }),
    [startDateStr, endDateStr, refreshTick]
  )

  const rooms = roomsData?.data || []
  const reservations = resData?.data || []

  // Map each room and day to any reservation active on that night
  // Supports multi-room reservations (rooms[]) and legacy single room (room)
  const cellMap = useMemo(() => {
    const map = {}
    reservations.forEach((r) => {
      const targetRoomIds = []
      if (Array.isArray(r.rooms) && r.rooms.length > 0) {
        r.rooms.forEach((rm) => {
          const id = typeof rm === 'object' ? rm?._id : rm
          if (id) targetRoomIds.push(String(id))
        })
      }
      if (r.room) {
        const id = typeof r.room === 'object' ? r.room?._id : r.room
        if (id && !targetRoomIds.includes(String(id))) {
          targetRoomIds.push(String(id))
        }
      }
      if (targetRoomIds.length === 0) return

      const rIn = new Date(r.checkIn)
      rIn.setHours(0, 0, 0, 0)
      const rOut = new Date(r.checkOut)
      rOut.setHours(0, 0, 0, 0)

      days.forEach((day, dayIndex) => {
        if (day >= rIn && day < rOut) {
          targetRoomIds.forEach((rmId) => {
            const key = `${rmId}_${dayIndex}`
            map[key] = r
          })
        }
      })
    })
    return map
  }, [reservations, days])

  const handleCellClick = (room, day) => {
    const dateStr = day.toISOString().split('T')[0]
    // Navigate to create reservation prefilled with room and date
    navigate(`/staff/reservations/new?roomId=${room._id}&checkIn=${dateStr}`)
  }

  const loading = roomsLoading || resLoading
  const error = roomsError || resError

  return (
    <div className="page-container" style={{ maxWidth: '100%' }}>
      <PageHeader
        title="Tape Chart &bull; Room Grid"
        subtitle="14-day occupancy tape chart. Click any empty cell to book; click a reserved bar to inspect the folio."
      >
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-moss)', display: 'inline-block' }} />
            Confirmed
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-slate)', display: 'inline-block' }} />
            Checked In
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-ochre)', display: 'inline-block' }} />
            Pending
          </span>
        </div>
      </PageHeader>

      {error && <ErrorState message={error} onRetry={() => { refetchRooms(); refetchRes(); }} />}

      {loading && (
        <div>
          <Skeleton height="50px" style={{ marginBottom: '12px' }} />
          <Skeleton height="400px" />
        </div>
      )}

      {!loading && !error && (
        <div style={{
          border: 'var(--border)',
          borderRadius: 'var(--radius)',
          backgroundColor: 'var(--color-paper)',
          overflowX: 'auto',
          position: 'relative',
          boxShadow: 'none',
        }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '980px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-ink)' }}>
                {/* Sticky room column header */}
                <th style={{
                  width: '160px',
                  padding: '12px',
                  backgroundColor: 'var(--color-paper)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  borderRight: '2px solid var(--color-ink)',
                }}>
                  Chamber
                </th>
                {days.map((day, idx) => {
                  const isToday = idx === 0
                  return (
                    <th
                      key={idx}
                      style={{
                        padding: '8px 4px',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: isToday ? 'var(--color-ochre-bg)' : 'transparent',
                        borderRight: '1px solid var(--color-rule)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <div style={{ textTransform: 'uppercase', color: 'var(--color-stone)', fontSize: '0.6875rem' }}>
                        {day.toLocaleDateString('en-IN', { weekday: 'narrow' })}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                        {day.getDate()}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id} style={{ borderBottom: 'var(--border)' }}>
                  {/* Sticky room number column with Young Serif numeral */}
                  <td style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-paper)',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    borderRight: '2px solid var(--color-ink)',
                    whiteSpace: 'nowrap',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--color-ink)' }}>
                        {room.number}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-stone)', textTransform: 'uppercase' }}>
                        {room.roomType?.name?.slice(0, 4) || 'Ch'}
                      </span>
                      {room.status === 'maintenance' && (
                        <span style={{ fontSize: '0.625rem', color: 'var(--color-error)', fontWeight: 600 }}>
                          [MAINT]
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map((day, dayIndex) => {
                    const key = `${room._id}_${dayIndex}`
                    const res = cellMap[key]
                    const isMaint = room.status === 'maintenance'

                    if (res) {
                      const { color, bg } = statusColor(res.status)
                      return (
                        <td
                          key={dayIndex}
                          onClick={() => setSelectedReservation(res)}
                          style={{
                            padding: '2px',
                            borderRight: '1px solid var(--color-rule)',
                            backgroundColor: bg,
                            cursor: 'pointer',
                            textAlign: 'center',
                          }}
                          title={`Reserved: ${res.reservationCode} (${res.status})`}
                        >
                          <div style={{
                            backgroundColor: color,
                            color: '#fff',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '4px 2px',
                            borderRadius: '1px',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}>
                            {res.reservationCode.slice(-4)}
                          </div>
                        </td>
                      )
                    }

                    if (isMaint) {
                      return (
                        <td
                          key={dayIndex}
                          style={{
                            backgroundColor: 'var(--color-stone-bg)',
                            borderRight: '1px solid var(--color-rule)',
                            textAlign: 'center',
                            color: 'var(--color-stone)',
                            fontSize: '0.625rem',
                          }}
                        >
                          &times;
                        </td>
                      )
                    }

                    return (
                      <td
                        key={dayIndex}
                        onClick={() => handleCellClick(room, day)}
                        style={{
                          borderRight: '1px solid var(--color-rule)',
                          cursor: 'pointer',
                          transition: 'background-color var(--transition)',
                          textAlign: 'center',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-rule)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        title={`Available — click to book chamber ${room.number} on ${formatDate(day)}`}
                      >
                        <span style={{ color: 'transparent', fontSize: '0.75rem' }}>+</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reservation quick inspection modal */}
      {selectedReservation && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReservation(null)}
          title={`Reservation ${selectedReservation.reservationCode}`}
          maxWidth="480px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9375rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-stone)' }}>Status:</span>
              <StatusBadge status={selectedReservation.status} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-stone)' }}>Guest:</span>
              <span style={{ fontWeight: 600 }}>{selectedReservation.guest?.fullName || '—'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-stone)' }}>Chamber:</span>
              <span>Number {selectedReservation.room?.number || '—'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-stone)' }}>Dates:</span>
              <span>{formatDate(selectedReservation.checkIn)} &rarr; {formatDate(selectedReservation.checkOut)} ({selectedReservation.nights} nights)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-stone)' }}>Total Charges:</span>
              <span style={{ fontWeight: 600 }}>{formatINR(selectedReservation.totalAmount)}</span>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setSelectedReservation(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const id = selectedReservation._id
                  setSelectedReservation(null)
                  navigate(`/staff/reservations/${id}`)
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--color-laterite)',
                  color: 'var(--color-paper)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 500,
                }}
              >
                Open Folio &rarr;
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

