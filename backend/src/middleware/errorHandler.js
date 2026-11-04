'use strict';
const mongoose = require('mongoose');

/**
 * Centralised error handler.
 * Handles: Mongoose ValidationError, CastError, duplicate key (11000),
 *          JWT errors (handled in auth.js), Zod errors, generic errors.
 * Always returns { success: false, message, errors[] }.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred. Please try again.';
  let errors = [];

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose CastError (bad ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for field '${err.path}': "${err.value}".`;
  }

  // MongoDB duplicate key
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = Object.values(err.keyValue || {})[0] || '';
    message = `A record with ${field} "${value}" already exists.`;
  }

  // CORS error
  else if (err.message && err.message.startsWith('CORS:')) {
    statusCode = 403;
    message = err.message;
  }

  // Generic HTTP errors with statusCode attached
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors || [];
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${statusCode} ${req.method} ${req.path}:`, err.message);
  }

  res.status(statusCode).json({ success: false, message, errors });
};

module.exports = errorHandler;

