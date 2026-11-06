'use strict';
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than 0'],
    },
    method: {
      type: String,
      enum: {
        values: ['cash', 'card', 'upi', 'demo_online'],
        message: 'Payment method must be cash, card, upi, or demo_online',
      },
      required: [true, 'Payment method is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['deposit', 'balance', 'full', 'refund'],
        message: 'Payment type must be deposit, balance, full, or refund',
      },
      default: 'full',
    },
    status: {
      type: String,
      enum: {
        values: ['paid', 'refunded', 'failed'],
        message: 'Payment status must be paid, refunded, or failed',
      },
      default: 'paid',
    },
    reference: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for online customer payments
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes (reference & idempotencyKey unique sparse indexes defined on schema fields)
paymentSchema.index({ reservation: 1 });
paymentSchema.index({ paidAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ method: 1 });
paymentSchema.index({ type: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
