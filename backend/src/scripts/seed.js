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
 *
 * Usage:
 *   npm run seed
 *   npm run seed:reset
 */
require('dotenv').config();

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
  const roomTypeKeys = Object.keys(rtMap);

  for (let floor = 1; floor <= 4; floor++) {
    for (let r = 1; r <= 10; r++) {
      const roomNum = `${floor}${String(r).padStart(2, '0')}`;
      let assignedType = rtMap['Standard'];

      // Variety distribution per floor
      if (r === 1 || r === 2) assignedType = rtMap['Standard'];
      else if (r === 3 || r === 4) assignedType = rtMap['Deluxe King'];
      else if (r === 5 || r === 6) assignedType = rtMap['Twin Deluxe'];
      else if (r === 7 || r === 8) assignedType = rtMap['Accessible Queen'];
      else if (r === 9) assignedType = rtMap['Executive Suite'];
      else if (r === 10) assignedType = floor === 4 ? rtMap['Penthouse Suite'] : rtMap['Executive Suite'];

      // Rooms 103 and 308 in maintenance
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

  // Customer linked guests
  customers.forEach((c) => {
    guestsData.push({
      fullName: c.name,
      phone: c.phone || '+91 98000 00000',
      email: c.email,
      user: c._id,
      idProof: 'Aadhaar: Verified via Digilocker',
    });
  });

  // Walk-in guests
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

  // Helper to append a reservation + payment
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
    const totalAmount = ratePerNight * nights;
    const resCode = formatDateCode(ci, seq++);

    const resDoc = {
      _id: new mongoose.Types.ObjectId(),
      reservationCode: resCode,
      guest: guestId,
      room: targetRoom._id,
      createdBy: createdById,
      checkIn: ci,
      checkOut: co,
      adults: Math.min(2, targetRt.capacity),
      ratePerNight,
      nights,
      totalAmount,
      status,
      notes,
      createdAt: daysFromNow(checkInN - 5),
    };

    reservationsToCreate.push(resDoc);

    // Payments
    if (paidStatus === 'full') {
      paymentsToCreate.push({
        reservation: resDoc._id,
        amount: totalAmount,
        method,
        status: 'paid',
        reference: `TXN-${resCode}-F`,
        receivedBy: receptionists[0]._id,
        paidAt: daysFromNow(checkInN),
      });
    } else if (paidStatus === 'partial') {
      const deposit = Math.round(totalAmount * 0.5);
      paymentsToCreate.push({
        reservation: resDoc._id,
        amount: deposit,
        method,
        status: 'paid',
        reference: `DEP-${resCode}`,
        receivedBy: receptionists[1]._id,
        paidAt: daysFromNow(checkInN - 2),
      });
    } else if (paidStatus === 'refunded') {
      paymentsToCreate.push({
        reservation: resDoc._id,
        amount: totalAmount,
        method: 'card',
        status: 'refunded',
        reference: `REF-${resCode}`,
        receivedBy: admin._id,
        paidAt: daysFromNow(checkInN),
      });
    }
  };

  // ── A. Rahul Verma (Demo Customer) Rich Stays ──────────────────────────────
  // 1 upcoming confirmed stay
  const rahulRoom = activeRooms.find((r) => r.number === '204'); // Deluxe King
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulRoom._id,
    createdById: rahul._id,
    checkInN: 3,
    checkOutN: 6,
    status: 'confirmed',
    notes: 'High floor preferred, quiet chamber for writing.',
    paidStatus: 'partial',
    method: 'upi',
  });

  // 2 past completed stays
  const rahulPastRoom1 = activeRooms.find((r) => r.number === '101');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulPastRoom1._id,
    createdById: rahul._id,
    checkInN: -42,
    checkOutN: -39,
    status: 'checked_out',
    notes: 'Late arrival via coastal ferry.',
    paidStatus: 'full',
    method: 'card',
  });

  const rahulPastRoom2 = activeRooms.find((r) => r.number === '304');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulPastRoom2._id,
    createdById: rahul._id,
    checkInN: -16,
    checkOutN: -13,
    status: 'checked_out',
    notes: 'Extra feather pillows requested.',
    paidStatus: 'full',
    method: 'upi',
  });

  // 1 cancelled stay
  const rahulCancelRoom = activeRooms.find((r) => r.number === '202');
  addReservation({
    guestId: rahulGuest._id,
    roomId: rahulCancelRoom._id,
    createdById: rahul._id,
    checkInN: -6,
    checkOutN: -4,
    status: 'cancelled',
    notes: 'Trip rescheduled due to Mumbai monsoon alerts.',
    paidStatus: 'refunded',
    method: 'card',
  });

  // ── B. 60 Past Stays (checked_out, paid in full) across all active rooms ───
  let guestIdx = 1;
  const methods = ['card', 'upi', 'cash'];

  // Past slots: windows from -75 to -3 days
  const pastWindows = [
    [-75, -72], [-71, -68], [-66, -62], [-61, -58], [-57, -54],
    [-52, -49], [-48, -45], [-44, -40], [-38, -35], [-34, -30],
    [-29, -26], [-25, -21], [-20, -17], [-15, -12], [-11, -8],
    [-7, -4], [-5, -2],
  ];

  for (let i = 0; i < 57; i++) {
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
      notes: i % 4 === 0 ? 'Harbour view commended by patron.' : '',
      paidStatus: 'full',
      method: methods[i % methods.length],
    });
  }

  // ── C. 10 Current In-House Stays (checked_in) ─────────────────────────────
  // Distinct rooms, checked in between -3 and -1, departing in +1 to +4 days
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
      notes: idx % 2 === 0 ? 'In-chamber fruit basket delivered.' : 'Early morning tea requested.',
      paidStatus: hasPaidFull ? 'full' : 'partial',
      method: methods[idx % methods.length],
    });
  });

  // ── D. 12 Upcoming Stays (confirmed & pending) ───────────────────────────
  // Non-overlapping with current stays: use rooms 11 to 22
  const upcomingRooms = activeRooms.slice(10, 22);
  upcomingRooms.forEach((room, idx) => {
    const checkInN = (idx % 4 + 1); // +1, +2, +3, +4
    const checkOutN = checkInN + (idx % 3 + 2); // 2 to 4 nights stay
    const guest = guests[(guestIdx++) % guests.length];
    const isConfirmed = idx < 7;

    addReservation({
      guestId: guest._id,
      roomId: room._id,
      createdById: isConfirmed ? receptionists[idx % 2]._id : guest.user || admin._id,
      checkInN,
      checkOutN,
      status: isConfirmed ? 'confirmed' : 'pending',
      notes: isConfirmed ? 'Airport transfer arranged with valet.' : 'Awaiting deposit verification.',
      paidStatus: isConfirmed ? (idx % 2 === 0 ? 'partial' : 'none') : 'none',
      method: 'upi',
    });
  });

  // ── E. 4 Additional Cancelled Stays (frees room dates) ─────────────────────
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
      notes: 'Patron cancelled due to change in sailing plans.',
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
      notes: 'Patron failed to report by midnight. Chamber released per policy.',
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

async function runSeed() {
  console.log('[SEED] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[SEED] Connected successfully.');

  await seedAllData();

  await mongoose.disconnect();
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('[SEED] ❌ Error seeding database:', err);
    process.exit(1);
  });
}

module.exports = { runSeed, seedAllData };
