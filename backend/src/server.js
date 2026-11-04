'use strict';
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

let server;

const start = async () => {
  try {
    await connectDB();
    server = app.listen(env.port, () => {
      console.log(`[SERVER] Harbour Row Hotel API running on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[SERVER] Database connection failed:', err.message);
    process.exit(1);
  }
};

start();

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`[SERVER] ${signal} received — shutting down gracefully`);
  if (server) {
    server.close(() => {
      console.log('[SERVER] HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
