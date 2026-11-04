'use strict';
const { z } = require('zod');

const createPaymentSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required'),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'card', 'upi'], {
    required_error: 'Payment method is required',
    invalid_type_error: 'Method must be cash, card, or upi',
  }),
  reference: z.string().trim().optional(),
});

module.exports = { createPaymentSchema };

