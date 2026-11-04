'use strict';
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

  let attempt = 0;
  const maxAttempts = 5;
  const baseDelay = 1000;

  while (attempt < maxAttempts) {
    try {
      await mongoose.connect(uri);
      console.log(`[DB] MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        console.error('[DB] Failed to connect after', maxAttempts, 'attempts');
        throw err;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[DB] Connection attempt ${attempt} failed. Retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
};

module.exports = connectDB;

