'use strict';
const { z } = require('zod');

const createPaymentSchema = z.object({
  reservationId: z.string().min(1, 'Reservation ID is required'),
  amount: z.number({ required_error: 'Amount is required' }).positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'card', 'upi', 'demo_online'], {
    required_error: 'Payment method is required',
    invalid_type_error: 'Method must be cash, card, upi, or demo_online',
  }),
  type: z.enum(['deposit', 'balance', 'full', 'refund']).optional(),
  reference: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
  note: z.string().trim().max(500).optional(),
});

const customerPaySchema = z.object({
  amountType: z.enum(['deposit', 'balance', 'full'], {
    required_error: 'amountType is required (deposit, balance, or full)',
  }),
  method: z.enum(['demo_online', 'card', 'upi']).default('demo_online'),
  idempotencyKey: z.string().trim().optional(),
});

const refundPaymentSchema = z.object({
  amount: z.number().positive('Refund amount must be greater than 0').optional(),
  reason: z.string().trim().max(500).optional(),
});

module.exports = {
  createPaymentSchema,
  customerPaySchema,
  refundPaymentSchema,
};
