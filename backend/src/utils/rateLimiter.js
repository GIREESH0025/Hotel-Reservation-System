'use strict';
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Rate limiter for authentication routes.
 * Limits to AUTH_RATE_LIMIT requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please wait 15 minutes before trying again.',
    errors: [],
  },
  skip: () => env.nodeEnv === 'test',
});

module.exports = { authLimiter };

