'use strict';
const { z } = require('zod');

const guestSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100).trim(),
  phone: z.string().min(1, 'Phone number is required').trim(),
  email: z.string().email('Please provide a valid email address').optional().or(z.literal('')),
  idProof: z.string().trim().optional(),
  user: z.string().optional().nullable(),
});

const updateGuestSchema = guestSchema.partial();

module.exports = { guestSchema, updateGuestSchema };

