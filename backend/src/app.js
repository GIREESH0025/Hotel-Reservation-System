'use strict';
require('dotenv').config();
const env = require('./config/env'); // validates env vars early

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Route modules
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const roomTypeRoutes = require('./routes/roomType.routes');
const roomRoutes = require('./routes/room.routes');
const guestRoutes = require('./routes/guest.routes');
const reservationRoutes = require('./routes/reservation.routes');
const paymentRoutes = require('./routes/payment.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();

// ── Security middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl, same-origin)
    if (!origin) return cb(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    const allowed = (env.clientOrigin || '')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean);

    // Allow configured origins, specific production domain, or Netlify/Vercel deployments
    if (
      allowed.includes(cleanOrigin) ||
      allowed.includes('*') ||
      cleanOrigin === 'https://harbourhotel.netlify.app' ||
      cleanOrigin.endsWith('.netlify.app') ||
      cleanOrigin.endsWith('.vercel.app')
    ) {
      return cb(null, true);
    }
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Sanitize NoSQL injection (in-place for Express 5 compatibility) ──────────
app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// ── Logging ─────────────────────────────────────────────────────────────────
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// ── API Routes & Health check ────────────────────────────────────────────────
const PREFIX = '/api/v1';

const healthHandler = (_req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
};

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Harbour Row Hotel API is operational',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      v1Health: `${PREFIX}/health`,
    },
  });
});

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get(`${PREFIX}/health`, healthHandler);

app.use(`${PREFIX}/auth`, authRoutes);
app.use(`${PREFIX}/users`, userRoutes);
app.use(`${PREFIX}/room-types`, roomTypeRoutes);
app.use(`${PREFIX}/rooms`, roomRoutes);
app.use(`${PREFIX}/guests`, guestRoutes);
app.use(`${PREFIX}/reservations`, reservationRoutes);
app.use(`${PREFIX}/payments`, paymentRoutes);
app.use(`${PREFIX}/reports`, reportRoutes);

// ── 404 & Error handling ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
