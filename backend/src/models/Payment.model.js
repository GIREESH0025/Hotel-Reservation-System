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
        values: ['cash', 'card', 'upi'],
        message: 'Payment method must be cash, card, or upi',
      },
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['paid', 'refunded'],
        message: 'Payment status must be paid or refunded',
      },
      default: 'paid',
    },
    reference: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Received-by staff member is required'],
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for quick lookups by reservation
paymentSchema.index({ reservation: 1 });
paymentSchema.index({ receivedBy: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

