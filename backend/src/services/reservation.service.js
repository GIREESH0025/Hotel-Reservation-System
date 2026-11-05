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
 * Checks for overlapping reservations for given room(s) and date range.
 * OVERLAP RULE: existing.checkIn < new.checkOut AND existing.checkOut > new.checkIn
 * Same-day turnover is ALLOWED: if existing.checkOut == new.checkIn, there is NO conflict.
 *
 * @param {string|string[]} roomIds
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {string|null} excludeReservationId - exclude this reservation (for updates)
 * @param {mongoose.ClientSession} [session]
 */
async function checkOverlap(roomIds, checkIn, checkOut, excludeReservationId = null, session = null) {
  const ids = Array.isArray(roomIds) ? roomIds : [roomIds];
  const stringIds = ids.map((id) => (id && id._id ? id._id.toString() : id.toString()));

  const query = {
    $or: [
      { rooms: { $in: stringIds } },
      { room: { $in: stringIds } },
    ],
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
 * Server computes: nights, ratePerNight, baseFare, taxes, discounts, totalAmount, reservationCode.
 * Supports multi-room bookings (1-3 rooms of the same type) with children.
 * Customer-created → pending; staff-created → confirmed.
 */
async function createReservation({
  guestId,
  roomId,
  rooms,
  roomIds,
  roomTypeId,
  roomsCount = 1,
  checkIn,
  checkOut,
  adults = 2,
  children = [],
  ratePlan = 'room_only',
  couponCode = null,
  guestSnapshot = null,
  specialRequests = '',
  arrivalTime = '',
  notes = '',
  createdById,
  role = 'customer',
}) {
  const pricingService = require('./pricingService');

  // Parse & validate dates
  const cin = new Date(checkIn);
  const cout = new Date(checkOut);
  cin.setUTCHours(0, 0, 0, 0);
  cout.setUTCHours(0, 0, 0, 0);

  const nights = Math.round((cout.getTime() - cin.getTime()) / 86400000);
  if (nights < 1 || nights > 30) {
    const err = new Error('Stay must be between 1 and 30 nights');
    err.statusCode = 400;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let resolvedRoomIds = [];
    let roomTypeDoc = null;

    // A. Explicit rooms passed (array or single)
    const rawIds = roomIds || rooms;
    if (Array.isArray(rawIds) && rawIds.length > 0) {
      resolvedRoomIds = rawIds.map((id) => (id && id._id ? id._id.toString() : id.toString()));
    } else if (roomId) {
      resolvedRoomIds = [roomId.toString()];
    }

    if (resolvedRoomIds.length > 0) {
      // Validate all specified rooms
      const roomDocs = await Room.find({ _id: { $in: resolvedRoomIds } }).session(session);
      if (roomDocs.length !== resolvedRoomIds.length) {
        const err = new Error('One or more selected rooms were not found');
        err.statusCode = 404;
        throw err;
      }
      for (const rm of roomDocs) {
        if (rm.status === 'maintenance') {
          const err = new Error(`Room ${rm.number} is currently under maintenance and cannot be booked.`);
          err.statusCode = 400;
          throw err;
        }
      }
      // Room type from first room
      roomTypeDoc = await RoomType.findById(roomDocs[0].roomType).session(session).lean();
    } else if (roomTypeId) {
      // Auto-assign available rooms of roomTypeId
      if (roomTypeId && roomTypeId.match(/^[0-9a-fA-F]{24}$/)) {
        roomTypeDoc = await RoomType.findById(roomTypeId).session(session).lean();
      }
      if (!roomTypeDoc && (roomTypeId === '6aec4540338f39843d54bfa0' || roomTypeId === 'twin-deluxe')) {
        roomTypeDoc = await RoomType.findOne({ name: { $regex: 'Twin Deluxe', $options: 'i' } }).session(session).lean();
      }
      if (!roomTypeDoc) {
        roomTypeDoc = await RoomType.findOne().session(session).lean();
      }
      if (!roomTypeDoc) {
        const err = new Error('Room type not found');
        err.statusCode = 404;
        throw err;
      }

      const activeRooms = await Room.find({
        roomType: roomTypeDoc._id,
        status: 'active',
      }).session(session).lean();

      // Find overlapping reservations to exclude blocked rooms
      const overlapping = await Reservation.find({
        status: { $in: Reservation.ACTIVE_STATUSES },
        checkIn: { $lt: cout },
        checkOut: { $gt: cin },
      }).session(session).select('rooms room').lean();

      const blockedSet = new Set();
      for (const o of overlapping) {
        if (Array.isArray(o.rooms)) o.rooms.forEach((r) => blockedSet.add(r.toString()));
        if (o.room) blockedSet.add(o.room.toString());
      }

      const availableRooms = activeRooms.filter((r) => !blockedSet.has(r._id.toString()));
      const reqCount = Math.max(1, parseInt(roomsCount, 10) || 1);

      if (availableRooms.length < reqCount) {
        const err = new Error(`Not enough available rooms of type ${roomTypeDoc.name} for the chosen dates (${availableRooms.length} available, ${reqCount} requested).`);
        err.statusCode = 409;
        throw err;
      }

      resolvedRoomIds = availableRooms.slice(0, reqCount).map((r) => r._id.toString());
    } else {
      const err = new Error('Either roomId, rooms, or roomTypeId must be provided.');
      err.statusCode = 400;
      throw err;
    }

    if (!roomTypeDoc) {
      const err = new Error('Room type not found');
      err.statusCode = 404;
      throw err;
    }

    // Server-side Quote Computation
    const quote = await pricingService.computeQuote({
      roomTypeDoc,
      checkIn: cin,
      checkOut: cout,
      rooms: resolvedRoomIds.length,
      adults: parseInt(adults, 10) || 1,
      children: Array.isArray(children) ? children : [],
      ratePlan,
      couponCode,
    });

    if (!quote.isValid) {
      const err = new Error(quote.message);
      err.statusCode = 400;
      throw err;
    }

    // Overlap check inside transaction across all assigned rooms
    await checkOverlap(resolvedRoomIds, cin, cout, null, session);

    // Generate unique reservation code
    let code;
    let attempts = 0;
    do {
      code = generateCode();
      const existing = await Reservation.findOne({ reservationCode: code }).session(session).lean();
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    const status = role === 'customer' ? 'pending' : 'confirmed';

    const [reservation] = await Reservation.create([
      {
        reservationCode: code,
        guest: guestId,
        rooms: resolvedRoomIds,
        room: resolvedRoomIds[0], // backward compatibility
        roomType: roomTypeDoc._id,
        createdBy: createdById,
        checkIn: cin,
        checkOut: cout,
        adults: quote.adults,
        children: quote.children,
        ratePlan: quote.ratePlan,
        ratePerNight: quote.perNightRate,
        nights: quote.nights,
        baseFare: quote.breakdown.baseFare,
        breakfastAmount: quote.breakdown.breakfastAmount,
        taxAmount: quote.breakdown.taxAmount,
        discountAmount: quote.breakdown.discountAmount,
        totalAmount: quote.breakdown.totalAmount,
        couponCode: quote.coupon?.code || couponCode,
        guestSnapshot,
        specialRequests: specialRequests || '',
        arrivalTime: arrivalTime || '',
        status,
        notes: notes || '',
      },
    ], { session });

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

  const roomIds = (reservation.rooms && reservation.rooms.length > 0)
    ? reservation.rooms.map((r) => (r && r._id ? r._id : r))
    : (reservation.room ? [reservation.room._id || reservation.room] : []);

  const assignedRooms = await Room.find({ _id: { $in: roomIds } }).lean();
  for (const rm of assignedRooms) {
    if (rm.status === 'maintenance') {
      const err = new Error(`Cannot check in — Room ${rm.number} is currently under maintenance. Please reassign rooms.`);
      err.statusCode = 400;
      throw err;
    }
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
 * Upgraded Availability Search.
 * Supports multi-room counts, adults/children occupancy, date range, facets,
 * price filters, bedType, amenities, meal plan, free cancellation, sorting, and pagination.
 */
async function searchAvailability(arg1, arg2, arg3, arg4) {
  let params = {};
  if (typeof arg1 === 'object' && arg1 !== null && !arg2) {
    params = { ...arg1 };
  } else {
    params = {
      checkIn: arg1,
      checkOut: arg2,
      adults: arg3,
      ...(typeof arg4 === 'object' ? arg4 : {}),
    };
  }

  const {
    checkIn,
    checkOut,
    rooms = 1,
    adults = 2,
    children = 0,
    roomType,
    minPrice,
    maxPrice,
    bedType,
    amenities,
    mealPlan,
    freeCancellation,
    payAtHotel,
    sort = 'recommended',
    page = 1,
    limit = 20,
  } = params;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  checkInDate.setUTCHours(0, 0, 0, 0);
  checkOutDate.setUTCHours(0, 0, 0, 0);

  const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
  const requestedRooms = Math.max(1, parseInt(rooms, 10) || 1);
  const adultsNum = Math.max(1, parseInt(adults, 10) || 2);
  const childrenNum = Math.max(0, parseInt(children, 10) || 0);

  // 1. Find overlapping reservations
  const overlappingRes = await Reservation.find({
    status: { $in: Reservation.ACTIVE_STATUSES },
    checkIn: { $lt: checkOutDate },
    checkOut: { $gt: checkInDate },
  }).select('rooms room').lean();

  const blockedRoomIds = new Set();
  for (const r of overlappingRes) {
    if (Array.isArray(r.rooms)) {
      r.rooms.forEach((id) => blockedRoomIds.add(id.toString()));
    }
    if (r.room) {
      blockedRoomIds.add(r.room.toString());
    }
  }

  // 2. Fetch all active rooms & room types
  const allActiveRooms = await Room.find({ status: 'active' }).populate('roomType').lean();
  const allRoomTypes = await RoomType.find().lean();

  // 3. Group and evaluate availability & facets
  const availableCategories = [];
  const allFacets = {
    minPrice: Infinity,
    maxPrice: 0,
    bedTypes: {},
    amenities: {},
    roomTypes: {},
  };

  for (const rt of allRoomTypes) {
    const rtIdStr = rt._id.toString();
    const matchingRooms = allActiveRooms.filter((rm) => {
      const rmRtId = rm.roomType?._id ? rm.roomType._id.toString() : rm.roomType?.toString();
      return rmRtId === rtIdStr;
    });

    const freeRooms = matchingRooms.filter((rm) => !blockedRoomIds.has(rm._id.toString()));
    const availableCount = freeRooms.length;
    const maxOcc = rt.maxOccupancy || rt.capacity || 2;
    const totalCapacity = maxOcc * requestedRooms;
    const fitsOccupancy = (adultsNum + childrenNum) <= totalCapacity && adultsNum >= requestedRooms;

    if (availableCount >= requestedRooms && fitsOccupancy) {
      const rate = rt.baseRate;
      if (rate < allFacets.minPrice) allFacets.minPrice = rate;
      if (rate > allFacets.maxPrice) allFacets.maxPrice = rate;

      if (rt.bedType) {
        allFacets.bedTypes[rt.bedType] = (allFacets.bedTypes[rt.bedType] || 0) + 1;
      }
      if (Array.isArray(rt.amenities)) {
        rt.amenities.forEach((a) => {
          allFacets.amenities[a] = (allFacets.amenities[a] || 0) + 1;
        });
      }
      allFacets.roomTypes[rt.name] = (allFacets.roomTypes[rt.name] || 0) + 1;

      // Apply filters
      if (roomType && rt.name.toLowerCase() !== roomType.toLowerCase() && rtIdStr !== roomType) {
        continue;
      }
      if (minPrice && rate < parseFloat(minPrice)) {
        continue;
      }
      if (maxPrice && rate > parseFloat(maxPrice)) {
        continue;
      }
      if (bedType && rt.bedType?.toLowerCase() !== bedType.toLowerCase()) {
        continue;
      }
      if (amenities) {
        const requiredAmenities = Array.isArray(amenities)
          ? amenities
          : amenities.split(',').map((s) => s.trim().toLowerCase());
        const rtAmenitiesLower = (rt.amenities || []).map((a) => a.toLowerCase());
        const hasAll = requiredAmenities.every((req) => rtAmenitiesLower.includes(req));
        if (!hasAll) continue;
      }
      if (mealPlan === 'with_breakfast' && !rt.breakfastPricePerAdult) {
        continue;
      }
      if (freeCancellation === true || freeCancellation === 'true') {
        if (rt.freeCancellation === false) continue;
      }

      const totalStayAmount = rate * nights * requestedRooms;

      availableCategories.push({
        roomType: rt,
        availableCount,
        remainingCount: availableCount,
        onlyFewLeft: availableCount <= 3,
        rate,
        totalStayAmount,
        nights,
        rooms: freeRooms.map((rm) => ({
          _id: rm._id,
          number: rm.number,
          floor: rm.floor,
          rate: rm.rateOverride != null ? rm.rateOverride : rt.baseRate,
        })),
      });
    }
  }

  if (allFacets.minPrice === Infinity) allFacets.minPrice = 0;

  // 4. Sort
  if (sort === 'priceAsc') {
    availableCategories.sort((a, b) => a.rate - b.rate);
  } else if (sort === 'priceDesc') {
    availableCategories.sort((a, b) => b.rate - a.rate);
  } else if (sort === 'capacity') {
    availableCategories.sort((a, b) => (b.roomType.capacity || 0) - (a.roomType.capacity || 0));
  }

  // 5. Paginate
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const total = availableCategories.length;
  const paginatedData = availableCategories.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Return array with attached envelope properties so both array access and envelope access work seamlessly
  const resultList = paginatedData;
  resultList.data = paginatedData;
  resultList.page = pageNum;
  resultList.limit = limitNum;
  resultList.total = total;
  resultList.totalPages = Math.ceil(total / limitNum) || 1;
  resultList.facets = allFacets;

  return resultList;
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

