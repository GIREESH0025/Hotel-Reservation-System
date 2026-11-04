'use strict';
const { z } = require('zod');

// Date string coercion helper: accepts 'YYYY-MM-DD' or ISO string, returns Date
const dateString = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date format. Use YYYY-MM-DD.' })
  .transform((s) => new Date(s));

const createReservationSchema = z.object({
  guestId: z.string().min(1, 'Guest ID is required').optional(), // optional for customers (auto-resolved)
  roomId: z.string().min(1, 'Room ID is required'),
  checkIn: dateString,
  checkOut: dateString,
  adults: z.number({ required_error: 'Number of adults is required' }).int().min(1).max(10),
  notes: z.string().max(500).optional(),
}).refine((d) => d.checkOut > d.checkIn, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut'],
}).refine((d) => {
  const nights = Math.round((d.checkOut - d.checkIn) / 86400000);
  return nights >= 1 && nights <= 30;
}, {
  message: 'Stay must be between 1 and 30 nights',
  path: ['checkOut'],
});

const updateReservationSchema = z.object({
  roomId: z.string().optional(),
  checkIn: dateString.optional(),
  checkOut: dateString.optional(),
  adults: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(500).optional(),
}).refine((d) => {
  if (d.checkIn && d.checkOut) return d.checkOut > d.checkIn;
  return true;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut'],
});

module.exports = { createReservationSchema, updateReservationSchema };

