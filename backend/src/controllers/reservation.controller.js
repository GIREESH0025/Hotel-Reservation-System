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

  // Customers only see own reservations
  if (req.user.role === 'customer') {
    const ownGuest = await Guest.findOne({ user: req.user.id }).lean();
    if (!ownGuest) return res.json({ success: true, data: [], page, limit, total: 0, totalPages: 0 });
    if (req.query.guestId && req.query.guestId !== ownGuest._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view your own reservations.', errors: [] });
    }
    filter.guest = ownGuest._id;
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
    filter.$or = [
      { reservationCode: { $regex: req.query.search, $options: 'i' } },
      { notes: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [data, total] = await Promise.all([
    Reservation.find(filter)
      .populate('guest', 'fullName phone email')
      .populate({ path: 'room', populate: { path: 'roomType', select: 'name' } })
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
    .populate({ path: 'room', populate: { path: 'roomType', select: 'name baseRate amenities' } })
    .populate('createdBy', 'name')
    .lean();

  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.', errors: [] });

  // Ownership check for customers
  if (req.user.role === 'customer') {
    const ownGuest = await Guest.findOne({ user: req.user.id }).lean();
    if (!ownGuest || reservation.guest._id.toString() !== ownGuest._id.toString()) {
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

  // For customers: auto-resolve their linked Guest record
  if (req.user.role === 'customer') {
    let ownGuest = await Guest.findOne({ user: req.user.id });
    if (!ownGuest) {
      const user = await require('../models/User.model').findById(req.user.id);
      ownGuest = await Guest.create({ fullName: user.name, phone: user.phone || '', email: user.email, user: user._id });
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
    checkIn: req.body.checkIn,
    checkOut: req.body.checkOut,
    adults: req.body.adults,
    notes: req.body.notes,
    createdById: req.user.id,
    role: req.user.role,
  });

  const populated = await Reservation.findById(reservation._id)
    .populate('guest', 'fullName phone')
    .populate({ path: 'room', populate: { path: 'roomType', select: 'name' } })
    .lean();

  res.status(201).json({ success: true, message: 'Reservation created.', data: populated });
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
};

