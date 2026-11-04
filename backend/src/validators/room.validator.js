'use strict';
const { z } = require('zod');

const roomSchema = z.object({
  number: z.string().min(1, 'Room number is required').trim(),
  floor: z.number({ required_error: 'Floor is required' }).int().min(0),
  roomType: z.string().min(1, 'Room type is required'),
  rateOverride: z.number().min(0).nullable().optional(),
  status: z.enum(['active', 'maintenance']).default('active'),
});

const updateRoomSchema = roomSchema.partial();

const toggleMaintenanceSchema = z.object({
  status: z.enum(['active', 'maintenance'], {
    required_error: 'Status must be active or maintenance',
  }),
});

module.exports = { roomSchema, updateRoomSchema, toggleMaintenanceSchema };

