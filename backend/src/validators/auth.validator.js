'use strict';
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name cannot exceed 80 characters').trim(),
  email: z.string().email('Please provide a valid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password too long'),
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };

