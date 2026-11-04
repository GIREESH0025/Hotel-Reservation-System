'use strict';
/**
 * Idempotent seed script for Hotel Reservation System.
 * Creates: 1 admin, 1 receptionist, 1 customer
 *          4 room types, ~20 rooms, ~10 guests, ~25 reservations, matching payments.
 *
 * SAFETY: Refuses to run in production without --force flag.
 * Usage: node src/scripts/seed.js
 *        node src/scripts/seed.js --force  (production)
 */
require('dotenv').config();

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('[SEED] ❌  Refusing to seed in production without --force flag.');
  process.exit(1);
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User.model');
const RoomType = require('../models/RoomType.model');
const Room = require('../models/Room.model');
const Guest = require('../models/Guest.model');
const Reservation = require('../models/Reservation.model');
const Payment = require('../models/Payment.model');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('[SEED] MONGODB_URI not set'); process.exit(1); }

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d;
}

function code(n) {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `RES-${dateStr}-${String(n).padStart(4,'0')}`;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('[SEED] Connected to MongoDB');

  // ── Clear existing data ────────────────────────────────────────────────────
  await Promise.all([
    Payment.deleteMany({}),
    Reservation.deleteMany({}),
    Guest.deleteMany({}),
    Room.deleteMany({}),
    RoomType.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('[SEED] Cleared existing data');

  // ── Users ─────────────────────────────────────────────────────────────────
  const [admin, receptionist, customer] = await User.create([
    { name: 'Admin User', email: 'admin@harbourrow.com', password: 'Admin@1234', role: 'admin', phone: '+91 98000 00001' },
    { name: 'Priya Receptionist', email: 'priya@harbourrow.com', password: 'Staff@1234', role: 'receptionist', phone: '+91 98000 00002' },
    { name: 'Rahul Customer', email: 'rahul@example.com', password: 'Guest@1234', role: 'customer', phone: '+91 98000 00003' },
  ]);
  console.log('[SEED] Created 3 users');

  // ── Room Types ────────────────────────────────────────────────────────────
  const [standard, deluxe, suite, presidential] = await RoomType.create([
    {
      name: 'Standard',
      description: 'Comfortable standard room with city view, queen bed, and all essential amenities.',
      baseRate: 2500,
      capacity: 2,
      amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Tea/Coffee Maker'],
    },
    {
      name: 'Deluxe',
      description: 'Spacious deluxe room with garden view, king bed, and upgraded amenities.',
      baseRate: 4500,
      capacity: 3,
      amenities: ['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Bathtub', 'Tea/Coffee Maker'],
    },
    {
      name: 'Suite',
      description: 'Luxurious suite with separate living area, ocean view, and butler service.',
      baseRate: 8500,
      capacity: 4,
      amenities: ['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Jacuzzi', 'Butler Service', 'Balcony'],
    },
    {
      name: 'Presidential Suite',
      description: 'The finest accommodation with panoramic views, full kitchen, and dedicated concierge.',
      baseRate: 18000,
      capacity: 6,
      amenities: ['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Full Kitchen', 'Private Pool', 'Butler Service', 'Concierge', 'Dining Room'],
    },
  ]);
  console.log('[SEED] Created 4 room types');

  // ── Rooms ─────────────────────────────────────────────────────────────────
  const rooms = await Room.create([
    // Floor 1 — Standard
    { number: '101', floor: 1, roomType: standard._id, status: 'active' },
    { number: '102', floor: 1, roomType: standard._id, status: 'active' },
    { number: '103', floor: 1, roomType: standard._id, status: 'maintenance' },
    { number: '104', floor: 1, roomType: standard._id, status: 'active' },
    { number: '105', floor: 1, roomType: standard._id, status: 'active' },
    // Floor 2 — Deluxe
    { number: '201', floor: 2, roomType: deluxe._id, status: 'active' },
    { number: '202', floor: 2, roomType: deluxe._id, status: 'active' },
    { number: '203', floor: 2, roomType: deluxe._id, status: 'active' },
    { number: '204', floor: 2, roomType: deluxe._id, status: 'maintenance' },
    { number: '205', floor: 2, roomType: deluxe._id, status: 'active' },
    // Floor 3 — Deluxe
    { number: '301', floor: 3, roomType: deluxe._id, status: 'active' },
    { number: '302', floor: 3, roomType: deluxe._id, status: 'active' },
    // Floor 4 — Suite
    { number: '401', floor: 4, roomType: suite._id, status: 'active' },
    { number: '402', floor: 4, roomType: suite._id, status: 'active' },
    { number: '403', floor: 4, roomType: suite._id, rateOverride: 9000, status: 'active' },
    // Floor 5 — Suite
    { number: '501', floor: 5, roomType: suite._id, status: 'active' },
    // Floor 6 — Presidential
    { number: '601', floor: 6, roomType: presidential._id, status: 'active' },
    { number: '602', floor: 6, roomType: presidential._id, rateOverride: 20000, status: 'active' },
    // Floor 7 — Presidential
    { number: '701', floor: 7, roomType: presidential._id, status: 'active' },
    { number: '702', floor: 7, roomType: presidential._id, status: 'active' },
  ]);
  console.log('[SEED] Created 20 rooms');

  // ── Guests ────────────────────────────────────────────────────────────────
  const guests = await Guest.create([
    { fullName: 'Rahul Customer', phone: '+91 98000 00003', email: 'rahul@example.com', user: customer._id },
    { fullName: 'Anjali Sharma', phone: '+91 98111 11111', email: 'anjali@example.com', idProof: 'Aadhar: 1234-5678-9012' },
    { fullName: 'Vikram Singh', phone: '+91 98222 22222', email: 'vikram@example.com', idProof: 'Passport: P12345678' },
    { fullName: 'Meera Nair', phone: '+91 98333 33333', email: 'meera@example.com' },
    { fullName: 'Rajan Pillai', phone: '+91 98444 44444', email: 'rajan@example.com', idProof: 'DL: MH01 20200012345' },
    { fullName: 'Sunita Desai', phone: '+91 98555 55555', email: 'sunita@example.com' },
    { fullName: 'Arun Kumar', phone: '+91 98666 66666', email: 'arun@example.com', idProof: 'Aadhar: 9876-5432-1098' },
    { fullName: 'Leela Krishnan', phone: '+91 98777 77777', email: 'leela@example.com' },
    { fullName: 'Farhan Akhtar', phone: '+91 98888 88888', email: 'farhan@example.com', idProof: 'Passport: P98765432' },
    { fullName: 'Pooja Mehta', phone: '+91 98999 99999', email: 'pooja@example.com' },
  ]);
  console.log('[SEED] Created 10 guests');

  // ── Reservations ──────────────────────────────────────────────────────────
  const reservations = await Reservation.create([
    // Currently checked in
    {
      reservationCode: code(1), guest: guests[1]._id, room: rooms[0]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-3), checkOut: daysFromNow(2), adults: 2,
      ratePerNight: 2500, nights: 5, totalAmount: 12500, status: 'checked_in',
    },
    {
      reservationCode: code(2), guest: guests[2]._id, room: rooms[5]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-1), checkOut: daysFromNow(3), adults: 2,
      ratePerNight: 4500, nights: 4, totalAmount: 18000, status: 'checked_in',
    },
    {
      reservationCode: code(3), guest: guests[3]._id, room: rooms[12]._id, createdBy: admin._id,
      checkIn: daysFromNow(-2), checkOut: daysFromNow(5), adults: 3,
      ratePerNight: 8500, nights: 7, totalAmount: 59500, status: 'checked_in',
    },
    // Arriving today (confirmed)
    {
      reservationCode: code(4), guest: guests[4]._id, room: rooms[1]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(0), checkOut: daysFromNow(2), adults: 2,
      ratePerNight: 2500, nights: 2, totalAmount: 5000, status: 'confirmed',
    },
    {
      reservationCode: code(5), guest: guests[5]._id, room: rooms[6]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(0), checkOut: daysFromNow(3), adults: 2,
      ratePerNight: 4500, nights: 3, totalAmount: 13500, status: 'confirmed',
    },
    // Upcoming (confirmed)
    {
      reservationCode: code(6), guest: guests[6]._id, room: rooms[7]._id, createdBy: admin._id,
      checkIn: daysFromNow(2), checkOut: daysFromNow(5), adults: 2,
      ratePerNight: 4500, nights: 3, totalAmount: 13500, status: 'confirmed',
    },
    {
      reservationCode: code(7), guest: guests[7]._id, room: rooms[13]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(5), checkOut: daysFromNow(8), adults: 2,
      ratePerNight: 8500, nights: 3, totalAmount: 25500, status: 'confirmed',
    },
    {
      reservationCode: code(8), guest: guests[8]._id, room: rooms[16]._id, createdBy: admin._id,
      checkIn: daysFromNow(7), checkOut: daysFromNow(10), adults: 4,
      ratePerNight: 18000, nights: 3, totalAmount: 54000, status: 'confirmed',
    },
    // Pending (customer-created)
    {
      reservationCode: code(9), guest: guests[0]._id, room: rooms[3]._id, createdBy: customer._id,
      checkIn: daysFromNow(10), checkOut: daysFromNow(13), adults: 2,
      ratePerNight: 2500, nights: 3, totalAmount: 7500, status: 'pending',
    },
    {
      reservationCode: code(10), guest: guests[9]._id, room: rooms[9]._id, createdBy: customer._id,
      checkIn: daysFromNow(14), checkOut: daysFromNow(16), adults: 2,
      ratePerNight: 4500, nights: 2, totalAmount: 9000, status: 'pending',
    },
    // Past — checked out
    {
      reservationCode: code(11), guest: guests[1]._id, room: rooms[10]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-15), checkOut: daysFromNow(-12), adults: 2,
      ratePerNight: 4500, nights: 3, totalAmount: 13500, status: 'checked_out',
    },
    {
      reservationCode: code(12), guest: guests[2]._id, room: rooms[4]._id, createdBy: admin._id,
      checkIn: daysFromNow(-20), checkOut: daysFromNow(-17), adults: 2,
      ratePerNight: 2500, nights: 3, totalAmount: 7500, status: 'checked_out',
    },
    {
      reservationCode: code(13), guest: guests[3]._id, room: rooms[14]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-30), checkOut: daysFromNow(-25), adults: 3,
      ratePerNight: 9000, nights: 5, totalAmount: 45000, status: 'checked_out',
    },
    // Cancelled
    {
      reservationCode: code(14), guest: guests[4]._id, room: rooms[15]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(20), checkOut: daysFromNow(23), adults: 2,
      ratePerNight: 8500, nights: 3, totalAmount: 25500, status: 'cancelled',
    },
    {
      reservationCode: code(15), guest: guests[5]._id, room: rooms[11]._id, createdBy: admin._id,
      checkIn: daysFromNow(-10), checkOut: daysFromNow(-7), adults: 2,
      ratePerNight: 4500, nights: 3, totalAmount: 13500, status: 'cancelled',
    },
    // No-show
    {
      reservationCode: code(16), guest: guests[6]._id, room: rooms[17]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-5), checkOut: daysFromNow(-2), adults: 4,
      ratePerNight: 20000, nights: 3, totalAmount: 60000, status: 'no_show',
    },
    // More upcoming
    {
      reservationCode: code(17), guest: guests[7]._id, room: rooms[18]._id, createdBy: admin._id,
      checkIn: daysFromNow(12), checkOut: daysFromNow(14), adults: 4,
      ratePerNight: 18000, nights: 2, totalAmount: 36000, status: 'confirmed',
    },
    {
      reservationCode: code(18), guest: guests[8]._id, room: rooms[8]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(3), checkOut: daysFromNow(6), adults: 2,
      ratePerNight: 4500, nights: 3, totalAmount: 13500, status: 'confirmed',
    },
    {
      reservationCode: code(19), guest: guests[9]._id, room: rooms[19]._id, createdBy: admin._id,
      checkIn: daysFromNow(25), checkOut: daysFromNow(30), adults: 4,
      ratePerNight: 18000, nights: 5, totalAmount: 90000, status: 'confirmed',
    },
    // More checked-out (for revenue reports)
    {
      reservationCode: code(20), guest: guests[0]._id, room: rooms[2]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-45), checkOut: daysFromNow(-42), adults: 2,
      ratePerNight: 2500, nights: 3, totalAmount: 7500, status: 'checked_out',
    },
    {
      reservationCode: code(21), guest: guests[1]._id, room: rooms[5]._id, createdBy: admin._id,
      checkIn: daysFromNow(-60), checkOut: daysFromNow(-57), adults: 2,
      ratePerNight: 4500, nights: 3, totalAmount: 13500, status: 'checked_out',
    },
    {
      reservationCode: code(22), guest: guests[2]._id, room: rooms[12]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-90), checkOut: daysFromNow(-85), adults: 3,
      ratePerNight: 8500, nights: 5, totalAmount: 42500, status: 'checked_out',
    },
    {
      reservationCode: code(23), guest: guests[3]._id, room: rooms[16]._id, createdBy: admin._id,
      checkIn: daysFromNow(-120), checkOut: daysFromNow(-117), adults: 4,
      ratePerNight: 18000, nights: 3, totalAmount: 54000, status: 'checked_out',
    },
    {
      reservationCode: code(24), guest: guests[4]._id, room: rooms[1]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-25), checkOut: daysFromNow(-23), adults: 1,
      ratePerNight: 2500, nights: 2, totalAmount: 5000, status: 'checked_out',
    },
    {
      reservationCode: code(25), guest: guests[5]._id, room: rooms[6]._id, createdBy: receptionist._id,
      checkIn: daysFromNow(-35), checkOut: daysFromNow(-33), adults: 2,
      ratePerNight: 4500, nights: 2, totalAmount: 9000, status: 'checked_out',
    },
  ]);
  console.log(`[SEED] Created ${reservations.length} reservations`);

  // ── Payments ───────────────────────────────────────────────────────────────
  const payments = [];

  // Fully paid: checked-out reservations (indices 10-14, 19-24)
  const checkedOutIndices = [10, 11, 12, 19, 20, 21, 22, 23, 24];
  for (const i of checkedOutIndices) {
    payments.push({
      reservation: reservations[i]._id,
      amount: reservations[i].totalAmount,
      method: ['cash', 'card', 'upi'][i % 3],
      status: 'paid',
      receivedBy: receptionist._id,
      paidAt: reservations[i].checkOut,
    });
  }

  // Partially paid: checked-in reservations (indices 0-2)
  payments.push({
    reservation: reservations[0]._id,
    amount: 5000,
    method: 'card',
    status: 'paid',
    receivedBy: receptionist._id,
    paidAt: reservations[0].checkIn,
  });
  payments.push({
    reservation: reservations[1]._id,
    amount: 10000,
    method: 'upi',
    status: 'paid',
    receivedBy: receptionist._id,
    paidAt: reservations[1].checkIn,
  });
  // Fully paid checked-in reservation 2
  payments.push({
    reservation: reservations[2]._id,
    amount: 59500,
    method: 'card',
    status: 'paid',
    receivedBy: admin._id,
    paidAt: reservations[2].checkIn,
  });

  await Payment.create(payments);
  console.log(`[SEED] Created ${payments.length} payments`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║         DEMO CREDENTIALS                 ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  Admin:                                   ║');
  console.log('║    Email:    admin@harbourrow.com         ║');
  console.log('║    Password: Admin@1234                   ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  Receptionist:                            ║');
  console.log('║    Email:    priya@harbourrow.com         ║');
  console.log('║    Password: Staff@1234                   ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  Customer:                                ║');
  console.log('║    Email:    rahul@example.com            ║');
  console.log('║    Password: Guest@1234                   ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  console.log('[SEED] ✅  Seed completed successfully');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[SEED] ❌  Error:', err.message);
  process.exit(1);
});

