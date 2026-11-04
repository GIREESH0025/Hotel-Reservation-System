'use strict';
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
      min: [0, 'Floor cannot be negative'],
    },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: [true, 'Room type is required'],
    },
    rateOverride: {
      type: Number,
      min: [0, 'Rate override cannot be negative'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'maintenance'],
        message: 'Status must be active or maintenance',
      },
      default: 'active',
    },
    // NOTE: occupancy is NEVER stored here — it is derived from Reservation documents.
  },
  { timestamps: true }
);

// Compound index for availability queries
roomSchema.index({ status: 1, roomType: 1 });

module.exports = mongoose.model('Room', roomSchema);

