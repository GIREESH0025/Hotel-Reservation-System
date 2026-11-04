'use strict';
const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    baseRate: {
      type: Number,
      required: [true, 'Base rate per night is required'],
      min: [0, 'Base rate cannot be negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity (max adults) is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [10, 'Capacity cannot exceed 10'],
    },
    amenities: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomType', roomTypeSchema);

