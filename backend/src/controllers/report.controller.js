'use strict';
const Reservation = require('../models/Reservation.model');
const Payment = require('../models/Payment.model');
const Room = require('../models/Room.model');
const asyncHandler = require('../middleware/asyncHandler');

/** GET /api/v1/reports/summary — Arrivals, departures, in-house today */
const summary = asyncHandler(async (req, res) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [arrivals, departures, inHouse, pendingCount] = await Promise.all([
    Reservation.countDocuments({ status: 'confirmed', checkIn: { $gte: todayStart, $lt: todayEnd } }),
    Reservation.countDocuments({ status: 'checked_in', checkOut: { $gte: todayStart, $lt: todayEnd } }),
    Reservation.countDocuments({ status: 'checked_in' }),
    Reservation.countDocuments({ status: 'pending' }),
  ]);

  res.json({ success: true, data: { arrivals, departures, inHouse, pendingCount, date: todayStart.toISOString().split('T')[0] } });
});

/** GET /api/v1/reports/revenue?from=&to= */
const revenue = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400000);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const pipeline = [
    {
      $match: {
        paidAt: { $gte: from, $lte: to },
        status: 'paid',
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
        totalRevenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', totalRevenue: 1, count: 1, _id: 0 } },
  ];

  const data = await Payment.aggregate(pipeline);
  const totalRevenue = data.reduce((s, d) => s + d.totalRevenue, 0);

  res.json({ success: true, data, totalRevenue, from: from.toISOString(), to: to.toISOString() });
});

/** GET /api/v1/reports/occupancy — By room type */
const occupancy = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  // Rooms occupied tonight
  const occupiedRoomIds = await Reservation.distinct('room', {
    status: 'checked_in',
    checkIn: { $lte: today },
    checkOut: { $gt: today },
  });

  const pipeline = [
    {
      $lookup: {
        from: 'reservations',
        let: { roomId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$room', '$$roomId'] },
              status: 'checked_in',
              checkIn: { $lte: today },
              checkOut: { $gt: today },
            },
          },
        ],
        as: 'activeReservations',
      },
    },
    {
      $group: {
        _id: '$roomType',
        totalRooms: { $sum: 1 },
        activeRooms: { $sum: { $cond: [{ $gt: [{ $size: '$activeReservations' }, 0] }, 1, 0] } },
        maintenanceRooms: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'roomtypes',
        localField: '_id',
        foreignField: '_id',
        as: 'roomType',
      },
    },
    { $unwind: '$roomType' },
    {
      $project: {
        roomType: { name: '$roomType.name', baseRate: '$roomType.baseRate' },
        totalRooms: 1,
        activeRooms: 1,
        maintenanceRooms: 1,
        availableRooms: { $subtract: ['$totalRooms', { $add: ['$activeRooms', '$maintenanceRooms'] }] },
        occupancyRate: {
          $round: [
            { $multiply: [{ $divide: ['$activeRooms', '$totalRooms'] }, 100] },
            1,
          ],
        },
      },
    },
  ];

  const data = await Room.aggregate(pipeline);
  res.json({ success: true, data, date: today.toISOString().split('T')[0] });
});

module.exports = { summary, revenue, occupancy };

