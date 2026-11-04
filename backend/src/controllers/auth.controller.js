'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Guest = require('../models/Guest.model');
const env = require('../config/env');
const asyncHandler = require('../middleware/asyncHandler');

const signToken = (userId) =>
  jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

/** POST /api/v1/auth/register */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const normalizedName = (name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email address already exists. Please log in or use a different email.',
      errors: [{ field: 'email', message: 'Email already in use' }],
    });
  }

  const user = await User.create({ name: normalizedName, email, password, phone, role: 'customer' });

  // Auto-create a Guest record linked to this user account
  await Guest.create({
    fullName: normalizedName,
    phone: phone || '',
    email,
    user: user._id,
  });

  const token = signToken(user._id);
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

/** POST /api/v1/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Always use the same error message for security (don't reveal which field is wrong)
  const genericError = {
    success: false,
    message: 'The email address or password you entered is incorrect. Please try again.',
    errors: [],
  };

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json(genericError);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json(genericError);

  const token = signToken(user._id);
  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

/** POST /api/v1/auth/logout */
const logout = asyncHandler(async (_req, res) => {
  // JWT is stateless — client drops the token
  res.json({ success: true, message: 'Logged out successfully.' });
});

/** GET /api/v1/auth/me */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.', errors: [] });
  res.json({ success: true, data: user });
});

module.exports = { register, login, logout, getMe };

