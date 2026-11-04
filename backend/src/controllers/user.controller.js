'use strict';
const User = require('../models/User.model');
const asyncHandler = require('../middleware/asyncHandler');

const buildQuery = (query) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.search) filter.$or = [
    { name: { $regex: query.search, $options: 'i' } },
    { email: { $regex: query.search, $options: 'i' } },
  ];
  return filter;
};

/** GET /api/v1/users */
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || '-createdAt';
  const filter = buildQuery(req.query);

  const [data, total] = await Promise.all([
    User.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** GET /api/v1/users/:id */
const getUser = asyncHandler(async (req, res) => {
  // Customers can only view own profile
  if (req.user.role === 'customer' && req.params.id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only view your own profile.', errors: [] });
  }
  const user = await User.findById(req.params.id).lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found.', errors: [] });
  res.json({ success: true, data: user });
});

/** PATCH /api/v1/users/:id */
const updateUser = asyncHandler(async (req, res) => {
  const targetId = req.params.id;
  const { role: actingRole, id: actingId } = req.user;

  // Only admin can change roles
  if (req.body.role && actingRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can change user roles.', errors: [] });
  }

  // Customers can only update own profile
  if (actingRole === 'customer' && targetId !== actingId) {
    return res.status(403).json({ success: false, message: 'You can only update your own profile.', errors: [] });
  }

  const allowed = actingRole === 'admin'
    ? ['name', 'phone', 'role']
    : ['name', 'phone'];

  const updates = {};
  for (const field of allowed) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(targetId, updates, { new: true, runValidators: true }).lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found.', errors: [] });

  res.json({ success: true, message: 'User updated.', data: user });
});

/** DELETE /api/v1/users/:id */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.', errors: [] });
  res.json({ success: true, message: 'User deleted.' });
});

module.exports = { listUsers, getUser, updateUser, deleteUser };

