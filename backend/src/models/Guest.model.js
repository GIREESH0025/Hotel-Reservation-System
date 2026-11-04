'use strict';
const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      trim: true,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    idProof: {
      type: String,
      trim: true,
    },
    // Optional link to a Customer user account
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Text index for full-text search
guestSchema.index({ fullName: 'text', email: 'text' });
// Regular index for name search (regex)
guestSchema.index({ fullName: 1 });
guestSchema.index({ user: 1 });

module.exports = mongoose.model('Guest', guestSchema);

