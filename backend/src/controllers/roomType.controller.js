'use strict';
const RoomType = require('../models/RoomType.model');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/v1/room-types */
const listRoomTypes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || 'name';
  const filter = req.query.search
    ? { name: { $regex: req.query.search, $options: 'i' } }
    : {};

  const [data, total] = await Promise.all([
    RoomType.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    RoomType.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** GET /api/v1/room-types/:id */
const getRoomType = asyncHandler(async (req, res) => {
  const rt = await RoomType.findById(req.params.id).lean();
  if (!rt) return res.status(404).json({ success: false, message: 'Room type not found.', errors: [] });
  res.json({ success: true, data: rt });
});

/** POST /api/v1/room-types */
const createRoomType = asyncHandler(async (req, res) => {
  const rt = await RoomType.create(req.body);
  res.status(201).json({ success: true, message: 'Room type created.', data: rt });
});

/** PATCH /api/v1/room-types/:id */
const updateRoomType = asyncHandler(async (req, res) => {
  const rt = await RoomType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
  if (!rt) return res.status(404).json({ success: false, message: 'Room type not found.', errors: [] });
  res.json({ success: true, message: 'Room type updated.', data: rt });
});

/** DELETE /api/v1/room-types/:id */
const deleteRoomType = asyncHandler(async (req, res) => {
  const rt = await RoomType.findByIdAndDelete(req.params.id);
  if (!rt) return res.status(404).json({ success: false, message: 'Room type not found.', errors: [] });
  res.json({ success: true, message: 'Room type deleted.' });
});

module.exports = { listRoomTypes, getRoomType, createRoomType, updateRoomType, deleteRoomType };

