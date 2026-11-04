'use strict';
const Guest = require('../models/Guest.model');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/v1/guests */
const listGuests = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || 'fullName';

  const filter = {};
  if (req.query.search) {
    filter.$or = [
      { fullName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Customers can only see their own guest record
  if (req.user.role === 'customer') {
    filter.user = req.user.id;
  }

  const [data, total] = await Promise.all([
    Guest.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Guest.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** GET /api/v1/guests/:id */
const getGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findById(req.params.id).lean();
  if (!guest) return res.status(404).json({ success: false, message: 'Guest not found.', errors: [] });

  // Ownership check for customers
  if (req.user.role === 'customer' && guest.user?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only view your own guest profile.', errors: [] });
  }

  res.json({ success: true, data: guest });
});

/** POST /api/v1/guests */
const createGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.create(req.body);
  res.status(201).json({ success: true, message: 'Guest created.', data: guest });
});

/** PATCH /api/v1/guests/:id */
const updateGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!guest) return res.status(404).json({ success: false, message: 'Guest not found.', errors: [] });
  res.json({ success: true, message: 'Guest updated.', data: guest });
});

/** DELETE /api/v1/guests/:id */
const deleteGuest = asyncHandler(async (req, res) => {
  const guest = await Guest.findByIdAndDelete(req.params.id);
  if (!guest) return res.status(404).json({ success: false, message: 'Guest not found.', errors: [] });
  res.json({ success: true, message: 'Guest deleted.' });
});

module.exports = { listGuests, getGuest, createGuest, updateGuest, deleteGuest };

