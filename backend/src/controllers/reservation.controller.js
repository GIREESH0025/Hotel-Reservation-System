'use strict';
const Reservation = require('../models/Reservation.model');
const Guest = require('../models/Guest.model');
const reservationService = require('../services/reservation.service');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/v1/reservations */
const listReservations = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || '-createdAt';

  const filter = {};

  // Customers only see own reservations: createdBy == user._id OR guest.user == user._id
  if (req.user.role === 'customer') {
    const User = require('../models/User.model');
    const userDoc = await User.findById(req.user.id).lean();
    const userEmail = userDoc?.email || req.user.email;

    const guestQueries = [{ user: req.user.id }];
    if (userEmail) guestQueries.push({ email: userEmail });
    const userGuests = await Guest.find({ $or: guestQueries }).select('_id').lean();
    const guestIds = userGuests.map((g) => g._id);

    if (req.query.guestId && !guestIds.some((id) => id.toString() === req.query.guestId.toString())) {
      return res.status(403).json({ success: false, message: 'You can only view your own reservations.', errors: [] });
    }

    const ownershipOr = [{ createdBy: req.user.id }];
    if (guestIds.length > 0) {
      ownershipOr.push({ guest: { $in: guestIds } });
    }
    filter.$or = ownershipOr;
  } else if (req.query.guestId) {
    filter.guest = req.query.guestId;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.roomType) {
    // Filter by room type requires joining — use aggregation or populate-based filtering
    const Room = require('../models/Room.model');
    const rooms = await Room.find({ roomType: req.query.roomType }, '_id').lean();
    filter.room = { $in: rooms.map((r) => r._id) };
  }
  if (req.query.roomId) filter.room = req.query.roomId;
  if (req.query.checkInFrom) filter.checkIn = { $gte: new Date(req.query.checkInFrom) };
  if (req.query.checkInTo) filter.checkIn = { ...filter.checkIn, $lte: new Date(req.query.checkInTo) };
  if (req.query.search) {
    const searchOr = [
      { reservationCode: { $regex: req.query.search, $options: 'i' } },
      { notes: { $regex: req.query.search, $options: 'i' } },
    ];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  const [data, total] = await Promise.all([
    Reservation.find(filter)
      .populate('guest', 'fullName phone email')
      .populate({ path: 'room', populate: { path: 'roomType', select: 'name baseRate images' } })
      .populate({ path: 'rooms', populate: { path: 'roomType', select: 'name baseRate images' } })
      .populate('roomType')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Reservation.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** GET /api/v1/reservations/:id */
const getReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('guest', 'fullName phone email idProof')
    .populate({ path: 'room', populate: { path: 'roomType', select: 'name baseRate amenities images' } })
    .populate({ path: 'rooms', populate: { path: 'roomType', select: 'name baseRate amenities images' } })
    .populate('roomType')
    .populate('createdBy', 'name')
    .lean();

  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.', errors: [] });

  // Ownership check for customers: createdBy == user._id OR guest.user == user._id OR guest.email == user.email
  if (req.user.role === 'customer') {
    const createdById = reservation.createdBy?._id
      ? reservation.createdBy._id.toString()
      : reservation.createdBy?.toString();
    const isCreator = createdById === req.user.id.toString();

    const guestUserId = reservation.guest?.user?._id
      ? reservation.guest.user._id.toString()
      : (reservation.guest?.user ? reservation.guest.user.toString() : null);

    let isGuestOwner = guestUserId === req.user.id.toString();
    if (!isGuestOwner && reservation.guest?.email && req.user.email) {
      isGuestOwner = reservation.guest.email.toLowerCase() === req.user.email.toLowerCase();
    }

    if (!isCreator && !isGuestOwner) {
      return res.status(403).json({ success: false, message: 'You can only view your own reservations.', errors: [] });
    }
  }

  // Compute balance
  const balance = await reservationService.computeBalance(reservation._id);

  res.json({ success: true, data: { ...reservation, balance } });
});

/** POST /api/v1/reservations */
const createReservation = asyncHandler(async (req, res) => {
  let guestId = req.body.guestId;

  // For customers: auto-resolve and link/reuse Guest record
  if (req.user.role === 'customer') {
    const User = require('../models/User.model');
    const user = await User.findById(req.user.id);
    let ownGuest = await Guest.findOne({ user: user._id });
    if (!ownGuest && user.email) {
      ownGuest = await Guest.findOne({ email: { $regex: new RegExp(`^${user.email}$`, 'i') } });
      if (ownGuest) {
        ownGuest.user = user._id;
        await ownGuest.save();
      }
    }
    if (!ownGuest) {
      ownGuest = await Guest.create({
        fullName: user.name,
        phone: user.phone || '',
        email: user.email,
        user: user._id,
      });
    }
    guestId = ownGuest._id.toString();

    // Customers cannot book in the past
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(req.body.checkIn); checkInDate.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: 'You cannot create a reservation with a past check-in date.',
        errors: [{ field: 'checkIn', message: 'Check-in date cannot be in the past' }],
      });
    }
  }

  if (!guestId) {
    return res.status(400).json({ success: false, message: 'guestId is required for staff reservations.', errors: [] });
  }

  const reservation = await reservationService.createReservation({
    guestId,
    roomId: req.body.roomId,
    rooms: req.body.rooms,
    roomIds: req.body.roomIds,
    roomTypeId: req.body.roomTypeId,
    roomsCount: req.body.roomsCount || (req.body.rooms ? req.body.rooms.length : 1),
    checkIn: req.body.checkIn,
    checkOut: req.body.checkOut,
    adults: req.body.adults,
    children: req.body.children,
    ratePlan: req.body.ratePlan,
    couponCode: req.body.couponCode,
    guestSnapshot: req.body.guestSnapshot,
    specialRequests: req.body.specialRequests,
    arrivalTime: req.body.arrivalTime,
    notes: req.body.notes,
    createdById: req.user.id,
    role: req.user.role,
  });

  const populated = await Reservation.findById(reservation._id)
    .populate('guest', 'fullName phone email')
    .populate({ path: 'room', populate: { path: 'roomType', select: 'name baseRate images' } })
    .populate({ path: 'rooms', populate: { path: 'roomType', select: 'name baseRate images' } })
    .populate('roomType')
    .lean();

  res.status(201).json({ success: true, message: 'Reservation created.', data: populated });
});

/** POST /api/v1/reservations/quote (Public) */
const getQuote = asyncHandler(async (req, res) => {
  const {
    roomTypeId,
    checkIn,
    checkOut,
    rooms = 1,
    adults = 2,
    children = [],
    ratePlan = 'room_only',
    couponCode = null,
  } = req.body;

  const RoomType = require('../models/RoomType.model');
  const pricingService = require('../services/pricingService');

  const roomTypeDoc = await RoomType.findById(roomTypeId).lean();
  if (!roomTypeDoc) {
    return res.status(404).json({ success: false, message: 'Room type not found.', errors: [] });
  }

  const quote = await pricingService.computeQuote({
    roomTypeDoc,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    rooms: parseInt(rooms, 10) || 1,
    adults: parseInt(adults, 10) || 1,
    children: Array.isArray(children) ? children : [],
    ratePlan,
    couponCode,
  });

  res.json({ success: true, data: quote });
});

/** PATCH /api/v1/reservations/:id */
const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.updateReservation(
    req.params.id,
    req.body,
    req.user.role
  );

  const populated = await Reservation.findById(reservation._id)
    .populate('guest', 'fullName phone')
    .populate({ path: 'room', populate: { path: 'roomType', select: 'name' } })
    .lean();

  res.json({ success: true, message: 'Reservation updated.', data: populated });
});

/** DELETE /api/v1/reservations/:id */
const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findByIdAndDelete(req.params.id);
  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.', errors: [] });
  res.json({ success: true, message: 'Reservation deleted.' });
});

/** PATCH /api/v1/reservations/:id/confirm */
const confirmReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.confirmReservation(req.params.id);
  res.json({ success: true, message: 'Reservation confirmed.', data: reservation });
});

/** PATCH /api/v1/reservations/:id/check-in */
const checkIn = asyncHandler(async (req, res) => {
  const reservation = await reservationService.checkIn(req.params.id);
  res.json({ success: true, message: 'Guest checked in.', data: reservation });
});

/** PATCH /api/v1/reservations/:id/check-out */
const checkOut = asyncHandler(async (req, res) => {
  const reservation = await reservationService.checkOut(req.params.id);
  res.json({ success: true, message: 'Guest checked out.', data: reservation });
});

/** PATCH /api/v1/reservations/:id/cancel */
const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await reservationService.cancelReservation(
    req.params.id,
    req.user.id,
    req.user.role
  );
  res.json({ success: true, message: 'Reservation cancelled.', data: reservation });
});

module.exports = {
  listReservations, getReservation, createReservation, updateReservation,
  deleteReservation, confirmReservation, checkIn, checkOut, cancelReservation,
  getQuote,
};

