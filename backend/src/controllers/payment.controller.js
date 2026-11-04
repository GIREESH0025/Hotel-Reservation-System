'use strict';
const Payment = require('../models/Payment.model');
const Reservation = require('../models/Reservation.model');
const Guest = require('../models/Guest.model');
const User = require('../models/User.model');
const { computeFinancials, computeBalance } = require('../services/reservation.service');
const paymentGateway = require('../services/paymentGateway');
const hotelConfig = require('../config/hotel.config');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/v1/payments
 * Lists payments.
 * Staff/Admin: all payments with filters.
 * Customer: own reservations' payments only.
 */
const listPayments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || '-paidAt';

  const filter = {};

  if (req.user.role === 'customer') {
    // Customer can only view payments for their own reservations
    const userGuests = await Guest.find({
      $or: [{ user: req.user.id }, { email: req.user.email }],
    }).select('_id').lean();
    const guestIds = userGuests.map((g) => g._id);

    const ownReservations = await Reservation.find({
      $or: [
        { createdBy: req.user.id },
        ...(guestIds.length > 0 ? [{ guest: { $in: guestIds } }] : []),
      ],
    }).select('_id').lean();
    const ownResIds = ownReservations.map((r) => r._id.toString());

    if (req.query.reservationId) {
      if (!ownResIds.includes(req.query.reservationId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You can only view payments for your own reservations.',
          errors: [],
        });
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
  if (req.query.type) filter.type = req.query.type;

  if (req.query.dateFrom) {
    filter.paidAt = { $gte: new Date(req.query.dateFrom) };
  }
  if (req.query.dateTo) {
    filter.paidAt = { ...filter.paidAt, $lte: new Date(req.query.dateTo) };
  }

  if (req.query.search) {
    const searchFilter = {
      $or: [
        { reference: { $regex: req.query.search, $options: 'i' } },
        { note: { $regex: req.query.search, $options: 'i' } },
      ],
    };
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, searchFilter];
      delete filter.$or;
    } else {
      Object.assign(filter, searchFilter);
    }
  }

  const [data, total] = await Promise.all([
    Payment.find(filter)
      .populate({ path: 'reservation', select: 'reservationCode totalAmount status guest' })
      .populate('receivedBy', 'name')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/**
 * GET /api/v1/payments/:id
 */
const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({
      path: 'reservation',
      select: 'reservationCode totalAmount guest status createdBy checkIn checkOut',
      populate: { path: 'guest', select: 'fullName email phone user' },
    })
    .populate('receivedBy', 'name')
    .lean();

  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.', errors: [] });

  // Ownership check for customers
  if (req.user.role === 'customer') {
    const resDoc = payment.reservation;
    const isCreator = resDoc?.createdBy && resDoc.createdBy.toString() === req.user.id.toString();
    const isGuestOwner = resDoc?.guest?.user && resDoc.guest.user.toString() === req.user.id.toString();
    const isEmailOwner = resDoc?.guest?.email && resDoc.guest.email.toLowerCase() === req.user.email.toLowerCase();

    if (!isCreator && !isGuestOwner && !isEmailOwner) {
      return res.status(403).json({ success: false, message: 'You can only view your own payments.', errors: [] });
    }
  }

  res.json({ success: true, data: payment });
});

/**
 * POST /api/v1/payments
 * Desk payment recorded by staff (cash, card, upi).
 */
const createPayment = asyncHandler(async (req, res) => {
  const { reservationId, amount, method, reference, note, idempotencyKey, type } = req.body;

  // Idempotency check
  if (idempotencyKey) {
    const existing = await Payment.findOne({ idempotencyKey }).lean();
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Payment already recorded (idempotent request).',
        data: existing,
      });
    }
  }

  const reservation = await Reservation.findById(reservationId);
  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.', errors: [] });

  if (!['pending', 'confirmed', 'checked_in'].includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot record payment for a reservation with status "${reservation.status}".`,
      errors: [],
    });
  }

  const fin = await computeFinancials(reservationId);
  if (amount > fin.balance + 0.001) {
    return res.status(400).json({
      success: false,
      message: `Payment amount (₹${amount.toFixed(2)}) exceeds outstanding balance (₹${fin.balance.toFixed(2)}).`,
      errors: [{ field: 'amount', message: `Maximum payable: ₹${fin.balance.toFixed(2)}` }],
    });
  }

  const paymentRef = reference || paymentGateway.generateReference('PAY');
  const paymentType = type || (amount >= fin.balance ? 'balance' : (fin.paidAmount === 0 ? 'deposit' : 'balance'));

  const payment = await Payment.create({
    reservation: reservationId,
    amount: Math.round(amount * 100) / 100,
    method,
    type: paymentType,
    status: 'paid',
    reference: paymentRef,
    idempotencyKey: idempotencyKey || undefined,
    receivedBy: req.user.id,
    note: note || '',
    paidAt: new Date(),
  });

  // If pending, recording a deposit or balance confirms the reservation
  if (reservation.status === 'pending') {
    reservation.status = 'confirmed';
    await reservation.save();
  }

  const updatedFin = await computeFinancials(reservationId);

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully.',
    data: payment,
    financials: updatedFin,
  });
});

/**
 * POST /api/v1/payments/:id/refund
 * Admin-only: Process a refund against an existing payment.
 */
const refundPayment = asyncHandler(async (req, res) => {
  const { amount: requestedAmount, reason } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.', errors: [] });

  if (payment.status !== 'paid' || payment.type === 'refund') {
    return res.status(400).json({
      success: false,
      message: 'Only positive completed payments can be refunded.',
      errors: [],
    });
  }

  // Check how much has already been refunded for this reservation/payment
  const existingRefunds = await Payment.find({
    reservation: payment.reservation,
    type: 'refund',
    note: { $regex: payment.reference, $options: 'i' },
  }).lean();

  const priorRefunded = existingRefunds.reduce((sum, r) => sum + r.amount, 0);
  const maxRefundable = Math.round((payment.amount - priorRefunded) * 100) / 100;

  if (maxRefundable <= 0) {
    return res.status(400).json({
      success: false,
      message: 'This payment has already been fully refunded.',
      errors: [],
    });
  }

  const refundAmount = requestedAmount ? Math.min(requestedAmount, maxRefundable) : maxRefundable;

  if (requestedAmount && requestedAmount > maxRefundable) {
    return res.status(400).json({
      success: false,
      message: `Requested refund of ₹${requestedAmount.toFixed(2)} exceeds refundable amount of ₹${maxRefundable.toFixed(2)}.`,
      errors: [{ field: 'amount', message: `Maximum refundable: ₹${maxRefundable.toFixed(2)}` }],
    });
  }

  const refundRef = paymentGateway.generateReference('REF');

  const refundDoc = await Payment.create({
    reservation: payment.reservation,
    amount: Math.round(refundAmount * 100) / 100,
    method: payment.method,
    type: 'refund',
    status: 'paid',
    reference: refundRef,
    receivedBy: req.user.id,
    note: `Refund against ${payment.reference}. Reason: ${reason || 'Staff initiated refund'}.`,
    paidAt: new Date(),
  });

  if (refundAmount >= maxRefundable) {
    payment.status = 'refunded';
    await payment.save();
  }

  const fin = await computeFinancials(payment.reservation);

  res.json({
    success: true,
    message: `Refund of ₹${refundAmount.toFixed(2)} processed successfully.`,
    data: refundDoc,
    financials: fin,
  });
});

/**
 * POST /api/v1/reservations/:id/pay
 * Customer online demo payment.
 * Server computes amount strictly:
 * - "deposit": 25% of totalAmount
 * - "balance": outstanding balance
 * - "full": totalAmount (or full remaining balance)
 */
const payReservation = asyncHandler(async (req, res) => {
  const { amountType, method = 'demo_online', idempotencyKey } = req.body;

  // Idempotency check
  if (idempotencyKey) {
    const existing = await Payment.findOne({ idempotencyKey }).lean();
    if (existing) {
      const fin = await computeFinancials(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Payment already processed (idempotent request).',
        data: existing,
        financials: fin,
      });
    }
  }

  const reservation = await Reservation.findById(req.params.id).populate('guest');
  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.', errors: [] });

  // Ownership check
  if (req.user.role === 'customer') {
    const isCreator = reservation.createdBy && reservation.createdBy.toString() === req.user.id.toString();
    const isGuestOwner = reservation.guest?.user && reservation.guest.user.toString() === req.user.id.toString();
    const isEmailOwner = reservation.guest?.email && reservation.guest.email.toLowerCase() === req.user.email.toLowerCase();

    if (!isCreator && !isGuestOwner && !isEmailOwner) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own reservations.', errors: [] });
    }
  }

  if (['cancelled', 'checked_out', 'no_show'].includes(reservation.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot process payment for reservation with status "${reservation.status}".`,
      errors: [],
    });
  }

  const fin = await computeFinancials(reservation._id);

  if (fin.balance <= 0) {
    return res.status(400).json({
      success: false,
      message: 'This reservation is already fully paid. No balance is due.',
      errors: [],
    });
  }

  let paymentAmount = 0;
  if (amountType === 'deposit') {
    if (fin.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit has already been paid for this stay. Please pay the remaining balance.',
        errors: [],
      });
    }
    paymentAmount = fin.depositRequired;
  } else if (amountType === 'balance' || amountType === 'full') {
    paymentAmount = fin.balance;
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid amountType. Must be deposit, balance, or full.',
      errors: [],
    });
  }

  // Call payment gateway
  const gwResult = await paymentGateway.processPayment({
    amount: paymentAmount,
    method,
    currency: 'INR',
    description: `Stay reservation ${reservation.reservationCode} (${amountType})`,
  });

  if (!gwResult.success) {
    return res.status(402).json({
      success: false,
      message: gwResult.message || 'Payment processing failed.',
      errors: [{ field: 'payment', message: gwResult.message }],
    });
  }

  // Create payment record
  const payment = await Payment.create({
    reservation: reservation._id,
    amount: paymentAmount,
    method,
    type: amountType,
    status: 'paid',
    reference: gwResult.reference,
    idempotencyKey: idempotencyKey || undefined,
    receivedBy: null, // Customer self-service payment
    note: `Online payment via Demo Gateway (${gwResult.transactionId})`,
    paidAt: new Date(),
  });

  // Advance status from pending to confirmed upon deposit or full payment
  if (reservation.status === 'pending') {
    reservation.status = 'confirmed';
    await reservation.save();
  }

  const updatedFin = await computeFinancials(reservation._id);

  res.status(201).json({
    success: true,
    message: `Payment of ₹${paymentAmount.toFixed(2)} confirmed.`,
    data: payment,
    financials: updatedFin,
  });
});

/**
 * GET /api/v1/reservations/:id/invoice
 * Returns formal folio statement / tax invoice with itemized line items.
 */
const getInvoice = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('guest', 'fullName email phone idProof address')
    .populate({
      path: 'room',
      populate: { path: 'roomType', select: 'name baseRate description' },
    })
    .populate('createdBy', 'name')
    .lean();

  if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.', errors: [] });

  // Ownership check for customers
  if (req.user.role === 'customer') {
    const isCreator = reservation.createdBy && (
      (reservation.createdBy._id ? reservation.createdBy._id.toString() : reservation.createdBy.toString()) === req.user.id
    );
    const guestUser = reservation.guest?.user ? reservation.guest.user.toString() : null;
    let isOwner = isCreator || (guestUser === req.user.id);
    if (!isOwner && reservation.guest?.email && req.user.email) {
      isOwner = reservation.guest.email.toLowerCase() === req.user.email.toLowerCase();
    }
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'You can only view invoices for your own reservations.', errors: [] });
    }
  }

  const financials = await computeFinancials(reservation._id);

  const roomName = reservation.room?.roomType?.name || 'Standard Room';
  const roomNumber = reservation.room?.number || '—';

  const lineItems = [
    {
      description: `${roomName} (Room ${roomNumber}) — ${reservation.nights} night(s) @ ₹${reservation.ratePerNight}/night`,
      quantity: reservation.nights,
      unitPrice: reservation.ratePerNight,
      amount: reservation.totalAmount,
    },
  ];

  const invoice = {
    invoiceNumber: `INV-${reservation.reservationCode.replace('RES-', '')}`,
    invoiceDate: new Date(),
    hotel: {
      name: hotelConfig.brandName,
      address: 'Near Gateway of India, Colaba, Mumbai 400001, Maharashtra, India',
      phone: '+91 22 2202 0000',
      email: 'reservations@harbourrow.com',
      taxId: '27AABCH1234F1Z8',
    },
    reservation: {
      id: reservation._id,
      code: reservation.reservationCode,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      nights: reservation.nights,
      adults: reservation.adults,
      status: reservation.status,
    },
    guest: {
      fullName: reservation.guest?.fullName || 'Valued Guest',
      email: reservation.guest?.email || '',
      phone: reservation.guest?.phone || '',
    },
    room: {
      number: roomNumber,
      type: roomName,
    },
    lineItems,
    financials: {
      subtotal: reservation.totalAmount,
      taxes: 0,
      totalAmount: financials.totalAmount,
      paidAmount: financials.paidAmount,
      refundedAmount: financials.refundedAmount,
      netPaid: financials.netPaid,
      balance: financials.balance,
      paymentStatus: financials.paymentStatus,
    },
    payments: financials.payments,
  };

  res.json({ success: true, data: invoice });
});

module.exports = {
  listPayments,
  getPayment,
  createPayment,
  refundPayment,
  payReservation,
  getInvoice,
};
