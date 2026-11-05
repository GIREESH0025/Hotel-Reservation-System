'use strict';
const Room = require('../models/Room.model');
const { searchAvailability } = require('../services/reservation.service');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/v1/rooms/availability */
const getAvailability = asyncHandler(async (req, res) => {
  const {
    checkIn,
    checkOut,
    adults = 2,
    rooms = 1,
    children = 0,
    roomType,
    minPrice,
    maxPrice,
    bedType,
    amenities,
    mealPlan,
    freeCancellation,
    payAtHotel,
    sort,
    page,
    limit,
  } = req.query;

  if (!checkIn || !checkOut) {
    return res.status(400).json({
      success: false,
      message: 'checkIn and checkOut are required query parameters.',
      errors: [],
    });
  }

  const adultsNum = parseInt(adults, 10);
  if (isNaN(adultsNum) || adultsNum < 1) {
    return res.status(400).json({ success: false, message: 'adults must be a positive integer.', errors: [] });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (isNaN(checkInDate) || isNaN(checkOutDate) || checkOutDate <= checkInDate) {
    return res.status(400).json({ success: false, message: 'Invalid date range. checkOut must be after checkIn.', errors: [] });
  }

  const results = await searchAvailability({
    checkIn,
    checkOut,
    adults: adultsNum,
    rooms: parseInt(rooms, 10) || 1,
    children: parseInt(children, 10) || 0,
    roomType,
    minPrice,
    maxPrice,
    bedType,
    amenities,
    mealPlan,
    freeCancellation,
    payAtHotel,
    sort,
    page,
    limit,
  });

  res.json({
    success: true,
    data: results.data || results,
    page: results.page || 1,
    limit: results.limit || 20,
    total: results.total || (Array.isArray(results) ? results.length : 0),
    totalPages: results.totalPages || 1,
    facets: results.facets || {},
    checkIn,
    checkOut,
    adults: adultsNum,
    rooms: parseInt(rooms, 10) || 1,
  });
});

/** GET /api/v1/rooms */
const listRooms = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const sort = req.query.sort || 'number';

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.roomType) filter.roomType = req.query.roomType;
  if (req.query.floor) filter.floor = parseInt(req.query.floor);
  if (req.query.search) filter.number = { $regex: req.query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Room.find(filter).populate('roomType').sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Room.countDocuments(filter),
  ]);

  res.json({ success: true, data, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** GET /api/v1/rooms/:id */
const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id).populate('roomType').lean();
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.', errors: [] });
  res.json({ success: true, data: room });
});

/** POST /api/v1/rooms */
const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  const populated = await room.populate('roomType');
  res.status(201).json({ success: true, message: 'Room created.', data: populated });
});

/** PATCH /api/v1/rooms/:id */
const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('roomType').lean();
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.', errors: [] });
  res.json({ success: true, message: 'Room updated.', data: room });
});

/** DELETE /api/v1/rooms/:id */
const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndDelete(req.params.id);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.', errors: [] });
  res.json({ success: true, message: 'Room deleted.' });
});

module.exports = { listRooms, getRoom, createRoom, updateRoom, deleteRoom, getAvailability };

