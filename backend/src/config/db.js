'use strict';
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

  // Local In-Memory Demo Mode (allows running locally without external MongoDB server)
  if (uri === 'memory') {
    console.log('[DB] Running in local IN-MEMORY demo mode');
    const { setupDB, store } = require('../../tests/helpers');
    await setupDB();

    // Auto-seed if empty
    if (store.users.length === 0) {
      await seedInMemory();
    }
    return;
  }

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

async function seedInMemory() {
  const { seedAllData } = require('../scripts/seed');
  await seedAllData();
  console.log('[DB] In-memory demo data seeded with rich realistic dataset');
}

module.exports = connectDB;
