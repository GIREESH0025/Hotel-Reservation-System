'use strict';
const { z } = require('zod');

// Date string coercion helper: accepts 'YYYY-MM-DD' or ISO string, returns Date
const dateString = z.string().refine((s) => !isNaN(Date.parse(s)), { message: 'Invalid date format. Use YYYY-MM-DD.' })
  .transform((s) => new Date(s));

const childSchema = z.union([
  z.object({ age: z.number().int().min(0).max(17) }),
  z.number().int().min(0).max(17).transform((n) => ({ age: n })),
]);

const createReservationSchema = z.object({
  guestId: z.string().min(1, 'Guest ID is required').optional(), // optional for customers (auto-resolved)
  roomId: z.string().optional(),
  rooms: z.array(z.string()).optional(),
  roomIds: z.array(z.string()).optional(),
  roomTypeId: z.string().optional(),
  roomsCount: z.number().int().min(1).max(3).optional(),
  checkIn: dateString,
  checkOut: dateString,
  adults: z.number({ required_error: 'Number of adults is required' }).int().min(1).max(30),
  children: z.array(childSchema).optional().default([]),
  ratePlan: z.enum(['room_only', 'with_breakfast']).optional().default('room_only'),
  couponCode: z.string().trim().optional(),
  guestSnapshot: z.object({
    name: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  specialRequests: z.string().max(300).optional(),
  arrivalTime: z.string().optional(),
  paymentChoice: z.enum(['full', 'deposit', 'at_hotel']).optional(),
  paymentMethod: z.enum(['demo_online', 'card', 'upi', 'netbanking']).optional(),
  idempotencyKey: z.string().optional(),
  notes: z.string().max(500).optional(),
}).refine((d) => d.roomId || d.rooms || d.roomIds || d.roomTypeId, {
  message: 'Either roomId, rooms, or roomTypeId is required',
  path: ['roomId'],
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

const quoteSchema = z.object({
  roomTypeId: z.string().min(1, 'Room type ID is required'),
  checkIn: dateString,
  checkOut: dateString,
  rooms: z.number().int().min(1).max(3).optional().default(1),
  adults: z.number().int().min(1).max(30).optional().default(2),
  children: z.array(childSchema).optional().default([]),
  ratePlan: z.enum(['room_only', 'with_breakfast']).optional().default('room_only'),
  couponCode: z.string().trim().optional(),
}).refine((d) => d.checkOut > d.checkIn, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut'],
});

const updateReservationSchema = z.object({
  roomId: z.string().optional(),
  rooms: z.array(z.string()).optional(),
  checkIn: dateString.optional(),
  checkOut: dateString.optional(),
  adults: z.number().int().min(1).max(30).optional(),
  children: z.array(z.object({ age: z.number().int().min(0).max(17) })).optional(),
  ratePlan: z.enum(['room_only', 'with_breakfast']).optional(),
  notes: z.string().max(500).optional(),
}).refine((d) => {
  if (d.checkIn && d.checkOut) return d.checkOut > d.checkIn;
  return true;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut'],
});

module.exports = { createReservationSchema, quoteSchema, updateReservationSchema };

