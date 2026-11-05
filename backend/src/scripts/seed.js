'use strict';
/**
 * Idempotent Seed Script for Harbour Row Hotel.
 * Populates:
 * - 1 Admin, 2 Receptionists, 6 Customers
 * - 6 Room Types with realistic INR tariffs
 * - 40 Rooms across 4 floors (rooms 103 and 308 in maintenance)
 * - 30 Guests (6 linked to customer accounts, 24 walk-ins)
 * - 90+ Reservations across past, current, upcoming, cancelled, no-show
 * - Rich stay history for primary demo customer rahul@example.com
 *   (3 past fully paid, 1 upcoming deposit paid with balance due, 1 pending unpaid, 1 cancelled with refund)
 *
 * Usage:
 *   npm run seed
 *   npm run seed:reset
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const User = require('../models/User.model');
const RoomType = require('../models/RoomType.model');
const Room = require('../models/Room.model');
const Guest = require('../models/Guest.model');
const Reservation = require('../models/Reservation.model');
const Payment = require('../models/Payment.model');
const { daysFromNow, formatDateCode, USERS_DATA, ROOM_TYPES_DATA, WALK_IN_GUESTS } = require('./seedDataGenerator');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_reservation_system';

async function seedAllData() {
  // 1. Wipe collections cleanly
  console.log('[SEED] Clearing collections...');
  await Promise.all([
    Payment.deleteMany({}),
    Reservation.deleteMany({}),
    Guest.deleteMany({}),
    Room.deleteMany({}),
    RoomType.deleteMany({}),
    User.deleteMany({}),
  ]);

  // 2. Users
  console.log('[SEED] Seeding users...');
  const users = await User.create(USERS_DATA);
  const admin = users.find((u) => u.role === 'admin');
  const receptionists = users.filter((u) => u.role === 'receptionist');
  const customers = users.filter((u) => u.role === 'customer');
  const rahul = customers.find((u) => u.email === 'rahul@example.com');

  // 3. Room Types
  console.log('[SEED] Seeding 6 room types...');
  const roomTypes = await RoomType.create(ROOM_TYPES_DATA);
  const rtMap = {};
  roomTypes.forEach((rt) => { rtMap[rt.name] = rt; });

  // 4. 40 Rooms across 4 floors
  console.log('[SEED] Seeding 40 rooms across 4 floors...');
  const roomsData = [];

  for (let floor = 1; floor <= 4; floor++) {
    for (let r = 1; r <= 10; r++) {
      const roomNum = `${floor}${String(r).padStart(2, '0')}`;
      let assignedType = rtMap['Standard'];

      if (r === 1 || r === 2) assignedType = rtMap['Standard'];
      else if (r === 3 || r === 4) assignedType = rtMap['Deluxe King'];
      else if (r === 5 || r === 6) assignedType = rtMap['Twin Deluxe'];
      else if (r === 7 || r === 8) assignedType = rtMap['Accessible Queen'];
      else if (r === 9) assignedType = rtMap['Executive Suite'];
      else if (r === 10) assignedType = floor === 4 ? rtMap['Penthouse Suite'] : rtMap['Executive Suite'];

      const isMaintenance = (roomNum === '103' || roomNum === '308');

      roomsData.push({
        number: roomNum,
        floor,
        roomType: assignedType._id,
        status: isMaintenance ? 'maintenance' : 'active',
      });
    }
  }

  const rooms = await Room.create(roomsData);
  const activeRooms = rooms.filter((r) => r.status === 'active');

  // 5. Guests (6 customer linked + 24 walk-ins = 30 guests)
  console.log('[SEED] Seeding 30 guests...');
  const guestsData = [];

  customers.forEach((c) => {
    guestsData.push({
      fullName: c.name,
      phone: c.phone || '+91 98000 00000',
      email: c.email,
      user: c._id,
      idProof: 'Aadhaar: Verified via Digilocker',
    });
  });

  WALK_IN_GUESTS.forEach((g) => {
    guestsData.push(g);
  });

  const guests = await Guest.create(guestsData);
  const rahulGuest = guests.find((g) => g.email === rahul.email);

  // 6. Reservations Generation
  console.log('[SEED] Generating ~90 non-overlapping reservations...');
  const reservationsToCreate = [];
  const paymentsToCreate = [];
  let seq = 1;

  const addReservation = ({
    guestId,
    roomId,
    createdById,
    checkInN,
    checkOutN,
    status,
    notes = '',
    paidStatus = 'full', // 'full', 'partial', 'none', 'refunded'
    method = 'card',
  }) => {
    const ci = daysFromNow(checkInN);
    const co = daysFromNow(checkOutN);
    const nights = Math.max(1, Math.round((co - ci) / 86400000));
    const targetRoom = rooms.find((r) => String(r._id) === String(roomId));
    const targetRt = roomTypes.find((rt) => String(rt._id) === String(targetRoom.roomType));
    const ratePerNight = targetRoom.rateOverride != null ? targetRoom.rateOverride : targetRt.baseRate;
    const baseFare = ratePerNight * nights;
    const taxAmount = Math.round(baseFare * 0.12);
    const totalAmount = baseFare + taxAmount;
    const resCode = formatDateCode(ci, seq++);

    const resDoc = {
      _id: new mongoose.Types.ObjectId(),
      reservationCode: resCode,
      guest: guestId,
      room: targetRoom._id,
      rooms: [targetRoom._id],
      roomType: targetRt._id,
      createdBy: createdById,
      checkIn: ci,
      checkOut: co,
      adults: Math.min(2, targetRt.capacity),
      children: [],
      ratePlan: 'room_only',
      ratePerNight,
      nights,
      baseFare,
      breakfastAmount: 0,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      status,
      notes,
      createdAt: daysFromNow(checkInN - 5),
    };

    reservationsToCreate.push(resDoc);

    const isOnline = method === 'demo_online';
    const receivedBy = isOnline ? null : receptionists[seq % receptionists.length]._id;

    if (paidStatus === 'full') {
      paymentsToCreate.push({
        reservation: resDoc._id,
        amount: totalAmount,
        method,
        type: 'full',
        status: 'paid',
        reference: `PAY-${resCode.replace('RES-', '')}-01`,
        idempotencyKey: `seed-pay-${resDoc._id}-full`,
        receivedBy,
        note: 'Full settlement of room charges.',
        paidAt: daysFromNow(checkInN),
      });
    } else if (paidStatus === 'partial') {
      const deposit = Math.round(totalAmount * 0.25 * 100) / 100;
      paymentsToCreate.push({
        reservation: resDoc._id,
        amount: deposit,
        method,
        type: 'deposit',
        status: 'paid',
        reference: `PAY-${resCode.replace('RES-', '')}-DEP`,
        idempotencyKey: `seed-pay-${resDoc._id}-dep`,
        receivedBy,
        note: '25% advance booking deposit.',
        paidAt: daysFromNow(checkInN - 2),
      });
    } else if (paidStatus === 'refunded') {
      const origRef = `PAY-${resCode.replace('RES-', '')}-01`;
      paymentsToCreate.push({
        reservation: resDoc._id,
        amount: totalAmount,
        method,
        type: 'full',
        status: 'refunded',
        reference: origRef,
        idempotencyKey: `seed-pay-${resDoc._id}-orig`,
        receivedBy,
        note: 'Initial room remittance (subsequently refunded).',
        paidAt: daysFromNow(checkInN - 7),
      });
      paymentsToCreate.push({
        reservation: resDoc._id,
        amount: totalAmount,
        method,
        type: 'refund',
        status: 'paid',
        reference: `REF-${resCode.replace('RES-', '')}-01`,
        idempotencyKey: `seed-pay-${resDoc._id}-ref`,
        receivedBy: admin._id,
        note: `Refund against ${origRef}. Stay cancelled > 48h prior to check-in.`,
        paidAt: daysFromNow(checkInN - 4),
      });
    }
  };

  // ── A. Rahul Verma (Demo Customer) Complete History ─────────────────────────
  // 1. Past Stay 1 (checked_out, fully paid)
  const rahulPastRoom1 = activeRooms.find((r) => r.number === '101');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulPastRoom1._id,
    createdById: rahul._id,
    checkInN: -50,
    checkOutN: -47,
    status: 'checked_out',
    notes: 'Late arrival via coastal ferry.',
    paidStatus: 'full',
    method: 'card',
  });

  // 2. Past Stay 2 (checked_out, fully paid)
  const rahulPastRoom2 = activeRooms.find((r) => r.number === '204');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulPastRoom2._id,
    createdById: rahul._id,
    checkInN: -28,
    checkOutN: -25,
    status: 'checked_out',
    notes: 'High floor, quiet corner preferred.',
    paidStatus: 'full',
    method: 'upi',
  });

  // 3. Past Stay 3 (checked_out, fully paid)
  const rahulPastRoom3 = activeRooms.find((r) => r.number === '304');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulPastRoom3._id,
    createdById: rahul._id,
    checkInN: -12,
    checkOutN: -9,
    status: 'checked_out',
    notes: 'Writing retreat; extra writing paper provided.',
    paidStatus: 'full',
    method: 'card',
  });

  // 4. Upcoming Stay (confirmed, 25% deposit paid, 75% balance due)
  const rahulUpcomingRoom = activeRooms.find((r) => r.number === '205');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulUpcomingRoom._id,
    createdById: rahul._id,
    checkInN: 4,
    checkOutN: 7,
    status: 'confirmed',
    notes: '25% deposit paid online. Remainder due on check-in.',
    paidStatus: 'partial',
    method: 'demo_online',
  });

  // 5. Pending Stay (unpaid, reserved online)
  const rahulPendingRoom = activeRooms.find((r) => r.number === '401');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulPendingRoom._id,
    createdById: rahul._id,
    checkInN: 14,
    checkOutN: 16,
    status: 'pending',
    notes: 'Pending stay reserved online; payment selected at hotel.',
    paidStatus: 'none',
    method: 'demo_online',
  });

  // 6. Cancelled Stay (with full refund)
  const rahulCancelRoom = activeRooms.find((r) => r.number === '202');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulCancelRoom._id,
    createdById: rahul._id,
    checkInN: -5,
    checkOutN: -2,
    status: 'cancelled',
    notes: 'Cancelled 5 days in advance; full deposit refunded automatically.',
    paidStatus: 'refunded',
    method: 'demo_online',
  });

  // ── B. 55 Past Stays (checked_out, paid in full) across all active rooms ───
  let guestIdx = 1;
  const methods = ['card', 'upi', 'cash', 'demo_online'];

  const pastWindows = [
    [-75, -72], [-71, -68], [-66, -62], [-61, -58], [-57, -54],
    [-52, -49], [-48, -45], [-44, -40], [-38, -35], [-34, -30],
    [-29, -26], [-25, -21], [-20, -17], [-15, -12], [-11, -8],
    [-7, -4], [-5, -2],
  ];

  for (let i = 0; i < 54; i++) {
    const room = activeRooms[i % activeRooms.length];
    const window = pastWindows[i % pastWindows.length];
    const guest = guests[guestIdx % guests.length];
    guestIdx++;

    addReservation({
      guestId: guest._id,
      roomId: room._id,
      createdById: receptionists[i % 2]._id,
      checkInN: window[0] - (Math.floor(i / activeRooms.length) * 3),
      checkOutN: window[1] - (Math.floor(i / activeRooms.length) * 3),
      status: 'checked_out',
      notes: i % 4 === 0 ? 'Waterfront view appreciated.' : '',
      paidStatus: 'full',
      method: methods[i % methods.length],
    });
  }

  // ── C. 10 Current In-House Stays (checked_in) ─────────────────────────────
  const currentRooms = activeRooms.slice(0, 10);
  currentRooms.forEach((room, idx) => {
    const checkInN = -(idx % 3 + 1); // -1, -2, -3
    const checkOutN = (idx % 3 + 2); // +2, +3, +4
    const guest = guests[(guestIdx++) % guests.length];
    const hasPaidFull = idx < 6;

    addReservation({
      guestId: guest._id,
      roomId: room._id,
      createdById: receptionists[idx % 2]._id,
      checkInN,
      checkOutN,
      status: 'checked_in',
      notes: idx % 2 === 0 ? 'Fresh towel service daily.' : 'Early departure scheduled.',
      paidStatus: hasPaidFull ? 'full' : 'partial',
      method: methods[idx % methods.length],
    });
  });

  // ── D. 12 Upcoming Stays (confirmed & pending) ───────────────────────────
  const upcomingRooms = activeRooms.slice(10, 22);
  upcomingRooms.forEach((room, idx) => {
    const checkInN = (idx % 4 + 1); // +1, +2, +3, +4
    const checkOutN = checkInN + (idx % 3 + 2); // 2 to 4 nights
    const guest = guests[(guestIdx++) % guests.length];
    const isConfirmed = idx < 7;

    addReservation({
      guestId: guest._id,
      roomId: room._id,
      createdById: isConfirmed ? receptionists[idx % 2]._id : guest.user || admin._id,
      checkInN,
      checkOutN,
      status: isConfirmed ? 'confirmed' : 'pending',
      notes: isConfirmed ? 'Airport transfer requested.' : 'Awaiting guest arrival.',
      paidStatus: isConfirmed ? (idx % 2 === 0 ? 'partial' : 'none') : 'none',
      method: 'upi',
    });
  });

  // ── E. 4 Additional Cancelled Stays ───────────────────────────────────────
  const cancelRooms = activeRooms.slice(22, 26);
  cancelRooms.forEach((room, idx) => {
    const guest = guests[(guestIdx++) % guests.length];
    addReservation({
      guestId: guest._id,
      roomId: room._id,
      createdById: receptionists[0]._id,
      checkInN: idx + 2,
      checkOutN: idx + 5,
      status: 'cancelled',
      notes: 'Guest cancelled travel plans.',
      paidStatus: idx % 2 === 0 ? 'refunded' : 'none',
      method: 'card',
    });
  });

  // ── F. 3 No-Show Stays ────────────────────────────────────────────────────
  const noShowRooms = activeRooms.slice(26, 29);
  noShowRooms.forEach((room, idx) => {
    const guest = guests[(guestIdx++) % guests.length];
    addReservation({
      guestId: guest._id,
      roomId: room._id,
      createdById: receptionists[1]._id,
      checkInN: -(idx + 4),
      checkOutN: -(idx + 1),
      status: 'no_show',
      notes: 'Guest did not check in by midnight. Room released.',
      paidStatus: 'none',
      method: 'card',
    });
  });

  // 7. Insert all generated reservations and payments
  console.log(`[SEED] Inserting ${reservationsToCreate.length} reservations...`);
  await Reservation.create(reservationsToCreate);

  console.log(`[SEED] Inserting ${paymentsToCreate.length} payments...`);
  await Payment.create(paymentsToCreate);

  console.log('─────────────────────────────────────────────────────────────────');
  console.log('[SEED] ✅ Seeding complete!');
  console.log(`  Users:        ${users.length} (1 Admin, 2 Receptionists, 6 Customers)`);
  console.log(`  Room Types:   ${roomTypes.length}`);
  console.log(`  Rooms:        ${rooms.length} (38 active, 2 under maintenance)`);
  console.log(`  Guests:       ${guests.length}`);
  console.log(`  Reservations: ${reservationsToCreate.length}`);
  console.log(`  Payments:     ${paymentsToCreate.length}`);
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Demo Credentials:');
  console.log('  Admin:        admin@harbourrow.com   / Admin@1234');
  console.log('  Staff:        priya@harbourrow.com   / Staff@1234');
  console.log('  Customer:     rahul@example.com      / Guest@1234');
  console.log('─────────────────────────────────────────────────────────────────');
  return { users, roomTypes, rooms, guests, reservationsToCreate, paymentsToCreate };
}

// CLI runner
async function main() {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed production database without --force flag');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  await seedAllData();
  await mongoose.disconnect();
  console.log('[SEED] Disconnected from database.');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[SEED ERROR]', err);
    process.exit(1);
  });
}

module.exports = { seedAllData };
