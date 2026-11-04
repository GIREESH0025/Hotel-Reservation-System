'use strict';

/**
 * Validates required environment variables on startup.
 * Throws an error listing ALL missing vars so the developer fixes everything at once.
 */
const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_ORIGIN',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables:\n  ${missing.join('\n  ')}\nCopy .env.example to .env and fill in all values.`
  );
}

module.exports = {
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  authRateLimit: parseInt(process.env.AUTH_RATE_LIMIT, 10) || 20,
};

