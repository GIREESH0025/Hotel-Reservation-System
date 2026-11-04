'use strict';
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation.model');
const Room = require('../models/Room.model');
const RoomType = require('../models/RoomType.model');
const Payment = require('../models/Payment.model');

/**
 * Generates a readable, unique reservation code.
 * Format: RES-YYYYMMDD-XXXX (4 random alphanumeric chars)
 */
function generateCode() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit ambiguous chars
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `RES-${dateStr}-${suffix}`;
}

/**
 * Checks for overlapping reservations for a given room and date range.
 * OVERLAP RULE: existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
 * Same-day turnover is ALLOWED: if existing.checkOut == new.checkIn, there is NO conflict.
 *
 * @param {string} roomId
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {string|null} excludeReservationId - exclude this reservation (for updates)
 * @param {mongoose.ClientSession} [session]
 */
async function checkOverlap(roomId, checkIn, checkOut, excludeReservationId = null, session = null) {
  const query = {
    room: roomId,
    status: { $in: Reservation.ACTIVE_STATUSES }, // pending, confirmed, checked_in
    checkIn: { $lt: checkOut },   // existing starts before new ends
    checkOut: { $gt: checkIn },   // existing ends after new starts
  };

  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }

  const opts = session ? { session } : {};
  const conflicting = await Reservation.findOne(query, null, opts)
    .populate('guest', 'fullName')
    .lean();

  if (conflicting) {
    const checkInStr = conflicting.checkIn.toISOString().split('T')[0];
    const checkOutStr = conflicting.checkOut.toISOString().split('T')[0];
    const err = new Error(
      `Room is not available for these dates. It is already reserved (${conflicting.reservationCode}) ` +
      `from ${checkInStr} to ${checkOutStr}. Please choose different dates or a different room.`
    );
    err.statusCode = 409;
    err.errors = [{ field: 'checkIn', message: 'Dates overlap with an existing reservation' }];
    throw err;
  }
}

/**
 * Computes the nightly rate for a room (rateOverride takes priority over roomType.baseRate).
 */
async function resolveRate(room) {
  if (room.rateOverride != null) return room.rateOverride;
  const rt = await RoomType.findById(room.roomType).lean();
  if (!rt) throw new Error('Room type not found');
  return rt.baseRate;
}

/**
 * Computes complete financial summary for a reservation:
 * totalAmount, paidAmount, refundedAmount, netPaid, balance, paymentStatus, deposit info.
 */
async function computeFinancials(reservationId, session = null) {
  const opts = session ? { session } : {};
  const reservation = await Reservation.findById(reservationId, null, opts).lean();
  if (!reservation) throw new Error('Reservation not found');

  const payments = await Payment.find({ reservation: reservationId }, null, opts).sort({ paidAt: 1 }).lean();

  let paidAmount = 0;
  let refundedAmount = 0;

  for (const p of payments) {
    if (p.status === 'paid') {
      if (p.type === 'refund') {
        refundedAmount += p.amount;
      } else {
        paidAmount += p.amount;
      }
    } else if (p.status === 'refunded') {
      paidAmount += p.amount;
      refundedAmount += p.amount;
    }
  }

  paidAmount = Math.round(paidAmount * 100) / 100;
  refundedAmount = Math.round(refundedAmount * 100) / 100;
  const netPaid = Math.max(0, Math.round((paidAmount - refundedAmount) * 100) / 100);
  const totalAmount = reservation.totalAmount;
  const balance = Math.max(0, Math.round((totalAmount - netPaid) * 100) / 100);

  let paymentStatus = 'unpaid';
  if (netPaid <= 0 && refundedAmount > 0) {
    paymentStatus = 'refunded';
  } else if (balance <= 0 && paidAmount > 0) {
    paymentStatus = 'paid';
  } else if (netPaid > 0) {
    paymentStatus = 'partial';
  }

  const depositPercent = 25;
  const depositRequired = Math.round(totalAmount * (depositPercent / 100) * 100) / 100;
  const depositPaid = netPaid >= depositRequired;

  return {
    totalAmount,
    paidAmount,
    refundedAmount,
    netPaid,
    balance,
    paymentStatus,
    depositRequired,
    depositPaid,
    depositPercent,
    payments,
  };
}

/**
 * Computes the balance due for a reservation.
 * Balance = totalAmount - netPaid
 */
async function computeBalance(reservationId, session = null) {
  const fin = await computeFinancials(reservationId, session);
  return fin.balance;
}

/**
 * Creates a new reservation inside a Mongoose transaction.
 * Server computes: nights, ratePerNight, totalAmount, reservationCode.
 * Customer-created → pending; staff-created → confirmed.
 */
async function createReservation({ guestId, roomId, checkIn, checkOut, adults, notes, createdById, role }) {
  // Validate dates before transaction
  const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
  if (nights < 1 || nights > 30) {
    const err = new Error('Stay must be between 1 and 30 nights');
    err.statusCode = 400;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Lock and validate room inside transaction
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      const err = new Error('Room not found'); err.statusCode = 404; throw err;
    }
    if (room.status === 'maintenance') {
      const err = new Error('This room is currently under maintenance and cannot be booked.'); err.statusCode = 400; throw err;
    }

    // Check capacity
    const roomType = await RoomType.findById(room.roomType).session(session).lean();
    if (!roomType) { const err = new Error('Room type not found'); err.statusCode = 404; throw err; }
    if (adults > roomType.capacity) {
      const err = new Error(`This room type accommodates a maximum of ${roomType.capacity} adults. You requested ${adults}.`);
      err.statusCode = 400; throw err;
    }

    // Overlap check inside transaction
    await checkOverlap(roomId, new Date(checkIn), new Date(checkOut), null, session);

    const ratePerNight = room.rateOverride != null ? room.rateOverride : roomType.baseRate;
    const totalAmount = Math.round(ratePerNight * nights * 100) / 100;
    const status = role === 'customer' ? 'pending' : 'confirmed';

    // Generate unique code
    let code;
    let attempts = 0;
    do {
      code = generateCode();
      const existing = await Reservation.findOne({ reservationCode: code }).session(session).lean();
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    const [reservation] = await Reservation.create([{
      reservationCode: code,
      guest: guestId,
      room: roomId,
      createdBy: createdById,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      adults,
      ratePerNight,
      nights,
      totalAmount,
      status,
      notes: notes || '',
    }], { session });

    await session.commitTransaction();
    return reservation;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Updates a reservation's dates/room inside a transaction (re-checks overlap).
 */
async function updateReservation(reservationId, updates, actingRole) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      const err = new Error('Reservation not found'); err.statusCode = 404; throw err;
    }

    const newRoomId = updates.roomId || reservation.room.toString();
    const newCheckIn = updates.checkIn ? new Date(updates.checkIn) : reservation.checkIn;
    const newCheckOut = updates.checkOut ? new Date(updates.checkOut) : reservation.checkOut;

    if (newCheckOut <= newCheckIn) {
      const err = new Error('Check-out date must be after check-in date'); err.statusCode = 400; throw err;
    }

    const nights = Math.round((newCheckOut - newCheckIn) / 86400000);
    if (nights < 1 || nights > 30) {
      const err = new Error('Stay must be between 1 and 30 nights'); err.statusCode = 400; throw err;
    }

    // Overlap check excluding this reservation
    await checkOverlap(newRoomId, newCheckIn, newCheckOut, reservationId, session);

    // Recompute amounts if dates/room changed
    let ratePerNight = reservation.ratePerNight;
    if (updates.roomId && updates.roomId !== reservation.room.toString()) {
      const room = await Room.findById(newRoomId).session(session).lean();
      if (!room) { const err = new Error('Room not found'); err.statusCode = 404; throw err; }
      const rt = await RoomType.findById(room.roomType).session(session).lean();
      ratePerNight = room.rateOverride != null ? room.rateOverride : rt.baseRate;
      reservation.room = newRoomId;
    }

    if (updates.checkIn) reservation.checkIn = newCheckIn;
    if (updates.checkOut) reservation.checkOut = newCheckOut;
    if (updates.adults !== undefined) reservation.adults = updates.adults;
    if (updates.notes !== undefined) reservation.notes = updates.notes;

    reservation.nights = nights;
    reservation.ratePerNight = ratePerNight;
    reservation.totalAmount = Math.round(ratePerNight * nights * 100) / 100;

    await reservation.save({ session });
    await session.commitTransaction();
    return reservation;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Confirms a pending reservation (staff only).
 */
async function confirmReservation(reservationId) {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) { const err = new Error('Reservation not found'); err.statusCode = 404; throw err; }
  if (reservation.status !== 'pending') {
    const err = new Error(`Only pending reservations can be confirmed. Current status: ${reservation.status}`);
    err.statusCode = 409; throw err;
  }
  reservation.status = 'confirmed';
  await reservation.save();
  return reservation;
}

/**
 * Checks a guest in.
 * Rules: status must be confirmed, today >= checkIn date, room not in maintenance.
 */
async function checkIn(reservationId) {
  const reservation = await Reservation.findById(reservationId).populate('room');
  if (!reservation) { const err = new Error('Reservation not found'); err.statusCode = 404; throw err; }

  if (reservation.status !== 'confirmed') {
    const err = new Error(`Only confirmed reservations can be checked in. Current status: ${reservation.status}`);
    err.statusCode = 409; throw err;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = new Date(reservation.checkIn);
  checkInDate.setHours(0, 0, 0, 0);

  if (today < checkInDate) {
    const err = new Error(
      `Cannot check in before the arrival date (${reservation.checkIn.toISOString().split('T')[0]}). ` +
      `Today is ${today.toISOString().split('T')[0]}.`
    );
    err.statusCode = 400; throw err;
  }

  if (reservation.room && reservation.room.status === 'maintenance') {
    const err = new Error('Cannot check in — the room is currently under maintenance. Please assign a different room.');
    err.statusCode = 400; throw err;
  }

  reservation.status = 'checked_in';
  await reservation.save();
  return reservation;
}

/**
 * Checks a guest out.
 * Rules: status must be checked_in AND balance = 0.
 */
async function checkOut(reservationId) {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) { const err = new Error('Reservation not found'); err.statusCode = 404; throw err; }

  if (reservation.status !== 'checked_in') {
    const err = new Error(`Only checked-in reservations can be checked out. Current status: ${reservation.status}`);
    err.statusCode = 409; throw err;
  }

  const balance = await computeBalance(reservationId);
  if (balance > 0) {
    const err = new Error(
      `Cannot check out — there is an outstanding balance of ₹${balance.toFixed(2)}. ` +
      `Please record the payment before checking out.`
    );
    err.statusCode = 409;
    err.errors = [{ field: 'balance', message: `Outstanding balance: ${balance}` }];
    throw err;
  }

  reservation.status = 'checked_out';
  await reservation.save();
  return reservation;
}

/**
 * Cancels a reservation.
 * Customer: can cancel own pending/confirmed only.
 * Staff: can cancel any non-checked-out reservation.
 */
async function cancelReservation(reservationId, actingUserId, actingRole) {
  const reservation = await Reservation.findById(reservationId).populate('guest');
  if (!reservation) { const err = new Error('Reservation not found'); err.statusCode = 404; throw err; }

  if (reservation.status === 'checked_in' || reservation.status === 'checked_out') {
    const err = new Error(
      `Cannot cancel a reservation with status "${reservation.status}". ` +
      `Only pending or confirmed reservations may be cancelled.`
    );
    err.statusCode = 409; throw err;
  }

  if (actingRole === 'customer') {
    // Customers can only cancel their own reservations (createdBy == userId OR guest.user == userId)
    const isCreator = reservation.createdBy && reservation.createdBy.toString() === actingUserId.toString();
    const Guest = require('../models/Guest.model');
    const guestDoc = await Guest.findById(reservation.guest).lean();
    const isGuestOwner = guestDoc && guestDoc.user && guestDoc.user.toString() === actingUserId.toString();

    if (!isCreator && !isGuestOwner) {
      const err = new Error('You can only cancel your own reservations.');
      err.statusCode = 403;
      throw err;
    }
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      const err = new Error(`You can only cancel pending or confirmed reservations. Current status: ${reservation.status}`);
      err.statusCode = 409;
      throw err;
    }
  }

  // Cancellation refund policy: if >= 48h before checkIn, refund all payments
  const now = new Date();
  const checkInDate = new Date(reservation.checkIn);
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  const hotelConfig = require('../config/hotel.config');
  const paymentGateway = require('./paymentGateway');

  if (hoursUntilCheckIn >= (hotelConfig.cancellationFreeHours || 48)) {
    const fin = await computeFinancials(reservation._id);
    if (fin.netPaid > 0) {
      await Payment.create({
        reservation: reservation._id,
        amount: fin.netPaid,
        method: 'demo_online',
        type: 'refund',
        status: 'paid',
        reference: paymentGateway.generateReference('REF'),
        note: `Automatic full refund upon cancellation >= 48h before arrival (${hoursUntilCheckIn.toFixed(1)}h remaining).`,
        paidAt: new Date(),
      });
    }
  }

  reservation.status = 'cancelled';
  await reservation.save();
  return reservation;
}

/**
 * Availability search.
 * Input: checkIn, checkOut, adults
 * Returns room types with count of free rooms (rooms in maintenance excluded).
 */
async function searchAvailability(checkIn, checkOut, adults) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Find all rooms that are ACTIVE and NOT blocked during the period
  const blockedRoomIds = await Reservation.distinct('room', {
    status: { $in: Reservation.ACTIVE_STATUSES },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  });

  const freeRooms = await Room.find({
    status: 'active',
    _id: { $nin: blockedRoomIds },
  }).populate('roomType').lean();

  // Group by room type, filter by capacity
  const grouped = {};
  for (const room of freeRooms) {
    if (!room.roomType) continue;
    const rt = room.roomType;
    if (rt.capacity < adults) continue; // Does not fit requested adults

    const rtId = rt._id.toString();
    if (!grouped[rtId]) {
      grouped[rtId] = {
        roomType: rt,
        availableCount: 0,
        rate: room.rateOverride != null ? room.rateOverride : rt.baseRate,
        rooms: [],
      };
    }
    grouped[rtId].availableCount++;
    grouped[rtId].rooms.push({ _id: room._id, number: room.number, floor: room.floor, rate: room.rateOverride != null ? room.rateOverride : rt.baseRate });
  }

  return Object.values(grouped);
}

module.exports = {
  createReservation,
  updateReservation,
  confirmReservation,
  checkIn,
  checkOut,
  cancelReservation,
  searchAvailability,
  computeBalance,
  computeFinancials,
  checkOverlap,
};

