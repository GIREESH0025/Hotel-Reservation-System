'use strict';
const Payment = require('../models/Payment.model');
const Reservation = require('../models/Reservation.model');
const Guest = require('../models/Guest.model');
const { computeBalance } = require('../services/reservation.service');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/v1/payments */
const listPayments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || '-paidAt';

  const filter = {};

  // Customers only see own payments (via their guest → reservations)
  if (req.user.role === 'customer') {
    const ownGuest = await Guest.findOne({ user: req.user.id }).lean();
    if (!ownGuest) return res.json({ success: true, data: [], page, limit, total: 0, totalPages: 0 });
    const ownReservations = await Reservation.find({ guest: ownGuest._id }, '_id').lean();
    const ownResIds = ownReservations.map((r) => r._id.toString());

    if (req.query.reservationId) {
      if (!ownResIds.includes(req.query.reservationId.toString())) {
        return res.status(403).json({ success: false, message: 'You can only view payments for your own reservations.', errors: [] });
      }
      filter.reservation = req.query.reservationId;
    } else {
      filter.reservation = { $in: ownReservations.map((r) => r._id) };
    }
  } else if (req.query.reservationId) {
    filter.reservation = req.query.reservationId;
  }

  if (req.query.method) filter.method = req.query.method;
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    Payment.find(filter)
      .populate({ path: 'reservation', select: 'reservationCode totalAmount status' })
      .populate('receivedBy', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** GET /api/v1/payments/:id */
const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({ path: 'reservation', select: 'reservationCode totalAmount guest status' })
    .populate('receivedBy', 'name')
    .lean();

  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.', errors: [] });

  // Ownership check for customers
  if (req.user.role === 'customer') {
    const ownGuest = await Guest.findOne({ user: req.user.id }).lean();
    const reservation = await Reservation.findById(payment.reservation._id).lean();
    if (!ownGuest || reservation.guest.toString() !== ownGuest._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view your own payments.', errors: [] });
    }
  }

  res.json({ success: true, data: payment });
});

/** POST /api/v1/payments */
const createPayment = asyncHandler(async (req, res) => {
  const { reservationId, amount, method, reference } = req.body;

  const reservation = await Reservation.findById(reservationId).lean();
  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.', errors: [] });

  if (!['pending', 'confirmed', 'checked_in'].includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot record payment for a reservation with status "${reservation.status}".`,
      errors: [],
    });
  }

  // Amount must not exceed outstanding balance
  const balance = await computeBalance(reservationId);
  if (amount > balance + 0.001) { // small epsilon for floating point
    return res.status(400).json({
      success: false,
      message: `Payment amount (₹${amount}) exceeds the outstanding balance (₹${balance.toFixed(2)}).`,
      errors: [{ field: 'amount', message: `Maximum payable: ₹${balance.toFixed(2)}` }],
    });
  }

  const payment = await Payment.create({
    reservation: reservationId,
    amount,
    method,
    reference,
    receivedBy: req.user.id,
    paidAt: new Date(),
  });

  const populated = await Payment.findById(payment._id)
    .populate({ path: 'reservation', select: 'reservationCode totalAmount' })
    .populate('receivedBy', 'name')
    .lean();

  res.status(201).json({ success: true, message: 'Payment recorded.', data: populated });
});

/** PATCH /api/v1/payments/:id/refund */
const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.', errors: [] });
  if (payment.status === 'refunded') {
    return res.status(400).json({ success: false, message: 'This payment has already been refunded.', errors: [] });
  }
  payment.status = 'refunded';
  await payment.save();
  res.json({ success: true, message: 'Payment refunded.', data: payment });
});

module.exports = { listPayments, getPayment, createPayment, refundPayment };

