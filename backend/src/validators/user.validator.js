'use strict';
const { z } = require('zod');

const updateUserSchema = z.object({
  name: z.string().min(2).max(80).trim().optional(),
  phone: z.string().trim().optional(),
  role: z.enum(['admin', 'receptionist', 'customer']).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72),
});

module.exports = { updateUserSchema, changePasswordSchema };

