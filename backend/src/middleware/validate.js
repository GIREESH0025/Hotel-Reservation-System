'use strict';

/**
 * validate(schema) — Zod schema validation middleware.
 * Validates req.body against the given Zod schema.
 * On failure, returns 400 with { success: false, message, errors[] }.
 *
 * Usage: router.post('/path', validate(myZodSchema), handler)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (result.success) {
    req.body = result.data; // Use parsed (and potentially transformed) data
    return next();
  }

  const issueList = result.error.issues || result.error.errors || [];
  const errors = issueList.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed. Please check the highlighted fields.',
    errors,
  });
};

module.exports = validate;
