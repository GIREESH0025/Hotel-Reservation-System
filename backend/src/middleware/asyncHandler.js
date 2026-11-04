'use strict';

/**
 * Wraps an async route handler to automatically catch errors
 * and pass them to Express's next() error handler.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

