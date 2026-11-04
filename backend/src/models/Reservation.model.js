'use strict';
const mongoose = require('mongoose');

const STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
const ACTIVE_STATUSES = ['pending', 'confirmed', 'checked_in']; // used for overlap detection

const reservationSchema = new mongoose.Schema(
  {
    reservationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created-by user is required'],
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    adults: {
      type: Number,
      required: [true, 'Number of adults is required'],
      min: [1, 'At least 1 adult required'],
      max: [10, 'Cannot exceed 10 adults'],
    },
    // Snapshot of the nightly rate at the time of booking
    ratePerNight: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    nights: {
      type: Number,
      required: true,
      min: [1, 'Stay must be at least 1 night'],
      max: [30, 'Stay cannot exceed 30 nights'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of: ${STATUSES.join(', ')}` },
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
// Primary overlap-detection index
reservationSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
// Status filtering
reservationSchema.index({ status: 1 });
// Guest lookup
reservationSchema.index({ guest: 1 });
// Code lookup
reservationSchema.index({ reservationCode: 1 }, { unique: true });
// Date-range reporting
reservationSchema.index({ checkIn: 1 });
reservationSchema.index({ checkOut: 1 });
// Text search on code and notes
reservationSchema.index({ reservationCode: 'text', notes: 'text' });

// ── Virtual: active statuses (used in services) ───────────────────────────
reservationSchema.statics.ACTIVE_STATUSES = ACTIVE_STATUSES;

module.exports = mongoose.model('Reservation', reservationSchema);

