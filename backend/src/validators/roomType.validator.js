'use strict';
const { z } = require('zod');

const roomTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Name cannot exceed 60 characters').trim(),
  description: z.string().max(500).trim().optional(),
  baseRate: z.number({ required_error: 'Base rate is required' }).min(0, 'Base rate cannot be negative'),
  capacity: z.number({ required_error: 'Capacity is required' }).int().min(1).max(10),
  amenities: z.array(z.string().trim()).default([]),
  image: z.string().url('Image must be a valid URL').trim().optional(),
});

const updateRoomTypeSchema = roomTypeSchema.partial();

module.exports = { roomTypeSchema, updateRoomTypeSchema };

