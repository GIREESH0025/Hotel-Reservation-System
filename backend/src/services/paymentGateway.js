'use strict';
/**
 * Payment Gateway Abstraction
 * In production, swappable for Stripe, Razorpay, or cash desk.
 * Currently runs 'demo' provider with realistic latencies and test card decline triggers.
 */

const crypto = require('crypto');

function generateReference(prefix = 'PAY') {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${rand}`;
}

const paymentGateway = {
  /**
   * Processes a demo customer payment.
   * Delay: 300ms simulated network trip.
   * If amount ends in .13, deliberately simulates a card/bank decline.
   */
  async processPayment({ amount, method = 'demo_online', currency = 'INR', description = '' }) {
    // 300ms simulated latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Test failure scenario: amount ends with .13 (e.g. 2500.13)
    const cents = Math.round(amount * 100) % 100;
    if (cents === 13) {
      return {
        success: false,
        message: 'Payment declined by issuer: simulated card decline for testing (amount ending in .13).',
      };
    }

    const reference = generateReference('PAY');
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    return {
      success: true,
      reference,
      transactionId,
      amount,
      currency,
      method,
      paidAt: new Date(),
    };
  },

  /**
   * Processes a refund via the gateway.
   */
  async processRefund({ originalReference, amount, reason = '' }) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const refundReference = generateReference('REF');
    return {
      success: true,
      reference: refundReference,
      originalReference,
      amount,
      refundedAt: new Date(),
      reason,
    };
  },

  generateReference,
};

module.exports = paymentGateway;
