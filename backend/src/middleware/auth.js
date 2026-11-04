'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User.model');
const asyncHandler = require('./asyncHandler');

/**
 * verifyToken — Authenticates a request using a Bearer JWT.
 * Attaches req.user = { id, email, role, name }.
 * Returns 401 if token is missing, invalid, or expired.
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
      errors: [],
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Your session has expired. Please log in again.'
        : 'Invalid token. Please log in again.';
    return res.status(401).json({ success: false, message, errors: [] });
  }

  // Confirm user still exists in DB (handles deleted accounts)
  const user = await User.findById(decoded.id).select('_id name email role');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Account not found. Please log in again.',
      errors: [],
    });
  }

  req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
  next();
});

/**
 * optionalToken — Optionally authenticates a request if Bearer token is provided.
 * Does not block if token is omitted.
 */
const optionalToken = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('_id name email role');
    if (user) {
      req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    }
  } catch {
    req.user = null;
  }
  next();
});

module.exports = { verifyToken, optionalToken };

