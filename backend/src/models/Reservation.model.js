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
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
      },
    ],
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
    },
    // Maintained for backward compatibility during migration
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
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
      max: [30, 'Cannot exceed 30 adults'],
    },
    children: [
      {
        age: {
          type: Number,
          min: [0, 'Child age cannot be negative'],
          max: [17, 'Child age cannot exceed 17'],
          required: true,
        },
      },
    ],
    ratePlan: {
      type: String,
      enum: ['room_only', 'with_breakfast'],
      default: 'room_only',
    },
    // Snapshot of the nightly rate per room at the time of booking
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
    baseFare: {
      type: Number,
      min: [0, 'Base fare cannot be negative'],
    },
    breakfastAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    couponCode: {
      type: String,
      trim: true,
    },
    guestSnapshot: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [300, 'Special requests cannot exceed 300 characters'],
    },
    arrivalTime: {
      type: String,
      trim: true,
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
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
// Primary overlap-detection indexes (multikey on rooms array & legacy single room)
reservationSchema.index({ rooms: 1, checkIn: 1, checkOut: 1 });
reservationSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
// Status filtering
reservationSchema.index({ status: 1 });
// Guest lookup
reservationSchema.index({ guest: 1 });
// Date-range reporting
reservationSchema.index({ checkIn: 1 });
reservationSchema.index({ checkOut: 1 });
// Text search on code and notes
reservationSchema.index({ reservationCode: 'text', notes: 'text' });

// ── Virtual: active statuses (used in services) ───────────────────────────
reservationSchema.statics.ACTIVE_STATUSES = ACTIVE_STATUSES;

module.exports = mongoose.model('Reservation', reservationSchema);

