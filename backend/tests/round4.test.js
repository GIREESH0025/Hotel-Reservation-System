'use strict';
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupDB, teardownDB, clearDB } = require('./helpers');

let app;

before(async () => {
  await setupDB();
  app = require('../src/app');
});

after(teardownDB);
beforeEach(clearDB);

async function setup() {
  const User = require('../src/models/User.model');
  const RoomType = require('../src/models/RoomType.model');
  const Room = require('../src/models/Room.model');
  const jwt = require('jsonwebtoken');

  const admin = await User.create({ name: 'Admin R4', email: 'admin@r4.test', password: 'Admin@1234', role: 'admin' });
  const c1 = await User.create({ name: 'Rahul R4', email: 'rahul@r4.test', password: 'Cust@1234', role: 'customer' });

  const rtDeluxe = await RoomType.create({
    name: 'Deluxe King',
    baseRate: 4000,
    capacity: 3,
    maxOccupancy: 3,
    size: 42,
    bedType: 'King Bed',
    amenities: ['Wi-Fi', 'Air Conditioning', 'Bathtub'],
    highlights: ['Private Balcony', 'Deep Soaking Tub'],
    breakfastPricePerAdult: 450,
    freeCancellation: true,
    images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  });

  const rtSuite = await RoomType.create({
    name: 'Executive Suite',
    baseRate: 8500,
    capacity: 4,
    maxOccupancy: 4,
    size: 65,
    bedType: 'King Bed',
    amenities: ['Wi-Fi', 'Air Conditioning', 'Ocean View', 'Jacuzzi'],
    highlights: ['Sea Vista', 'Jacuzzi Bath'],
    breakfastPricePerAdult: 500,
    freeCancellation: true,
    images: ['https://example.com/suite1.jpg'],
  });

  // Create 3 deluxe rooms and 1 suite room
  const room101 = await Room.create({ number: '101', floor: 1, roomType: rtDeluxe._id, status: 'active' });
  const room102 = await Room.create({ number: '102', floor: 1, roomType: rtDeluxe._id, status: 'active' });
  const room103 = await Room.create({ number: '103', floor: 1, roomType: rtDeluxe._id, status: 'active' });
  const room201 = await Room.create({ number: '201', floor: 2, roomType: rtSuite._id, status: 'active' });

  const tokenC1 = jwt.sign({ id: c1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const tokenAdmin = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return { admin, c1, rtDeluxe, rtSuite, room101, room102, room103, room201, tokenC1, tokenAdmin };
}

test('POST /api/v1/reservations/quote calculates server-authoritative fare, breakfast, tax slab, and coupons', async () => {
  const { rtDeluxe } = await setup();
  const ci = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0]; // 2 nights

  // 1. Basic Room Only quote (2 nights, 1 room, 2 adults @ 4000/night = 8000 baseFare, 12% GST = 960, total = 8960)
  const res1 = await request(app)
    .post('/api/v1/reservations/quote')
    .send({
      roomTypeId: rtDeluxe._id.toString(),
      checkIn: ci,
      checkOut: co,
      rooms: 1,
      adults: 2,
      ratePlan: 'room_only',
    });

  assert.strictEqual(res1.status, 200);
  assert.strictEqual(res1.body.success, true);
  assert.strictEqual(res1.body.data.nights, 2);
  assert.strictEqual(res1.body.data.baseFare, 8000);
  assert.strictEqual(res1.body.data.breakfastAmount, 0);
  assert.strictEqual(res1.body.data.taxAmount, 960);
  assert.strictEqual(res1.body.data.totalPayable, 8960);

  // 2. With Breakfast quote (2 nights * 2 adults * 450 = 1800 breakfast)
  // Base 8000 + 1800 = 9800. Tax slab on base + breakfast: 9800 * 0.12 = 1176. Total: 10976.
  const res2 = await request(app)
    .post('/api/v1/reservations/quote')
    .send({
      roomTypeId: rtDeluxe._id.toString(),
      checkIn: ci,
      checkOut: co,
      rooms: 1,
      adults: 2,
      ratePlan: 'with_breakfast',
    });

  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.body.data.breakfastAmount, 1800);
  assert.strictEqual(res2.body.data.taxAmount, 1176);
  assert.strictEqual(res2.body.data.totalPayable, 10976);

  // 3. With Coupon WELCOME10 (10% discount on base fare = 800)
  const res3 = await request(app)
    .post('/api/v1/reservations/quote')
    .send({
      roomTypeId: rtDeluxe._id.toString(),
      checkIn: ci,
      checkOut: co,
      rooms: 1,
      adults: 2,
      ratePlan: 'room_only',
      couponCode: 'WELCOME10',
    });

  assert.strictEqual(res3.status, 200);
  assert.strictEqual(res3.body.data.discountAmount, 800);
  assert.strictEqual(res3.body.data.couponApplied, 'WELCOME10');
  assert.strictEqual(res3.body.data.totalPayable, 8960 - 800);
});

test('Occupancy limit rejects booking when adults + children exceed room capacity', async () => {
  const { rtDeluxe, tokenC1 } = await setup();
  const ci = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0];

  // Deluxe capacity is 3. 1 room with 3 adults + 1 child = 4 > 3 -> 400 Bad Request
  const res = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({
      roomTypeId: rtDeluxe._id.toString(),
      roomsCount: 1,
      checkIn: ci,
      checkOut: co,
      adults: 3,
      children: [{ age: 5 }],
    });

  assert.strictEqual(res.status, 400);
  assert.match(res.body.message, /capacity|occupancy/i);
});

test('Multi-room booking assigns requested number of rooms and rejects overlaps across all assigned rooms', async () => {
  const { rtDeluxe, room101, room102, tokenC1, tokenAdmin } = await setup();
  const ci = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0];

  // Customer books 2 rooms of Deluxe type
  const res = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({
      roomTypeId: rtDeluxe._id.toString(),
      roomsCount: 2,
      checkIn: ci,
      checkOut: co,
      adults: 4,
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.rooms.length, 2);
  const assignedRoomIds = res.body.data.rooms.map((r) => (r._id ? r._id.toString() : r.toString()));

  // Attempting to book an explicit conflicting reservation on room 1 returns 409
  const conflictRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({
      roomId: assignedRoomIds[0],
      checkIn: ci,
      checkOut: co,
      adults: 2,
      guestId: (await require('../src/models/Guest.model').create({ fullName: 'Conflict Guest' }))._id.toString(),
    });

  assert.strictEqual(conflictRes.status, 409);
  assert.match(conflictRes.body.message, /already reserved/i);
});

test('Availability search returns facets, filters, and honors multi-room inventory counts', async () => {
  const { rtDeluxe, rtSuite } = await setup();
  const ci = new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 28 * 86400000).toISOString().split('T')[0];

  // 1. Search with rooms=1 should return both Deluxe (3 rooms free) and Suite (1 room free)
  const res1 = await request(app)
    .get('/api/v1/rooms/availability')
    .query({ checkIn: ci, checkOut: co, rooms: 1, adults: 2 });

  assert.strictEqual(res1.status, 200);
  assert.ok(res1.body.facets);
  assert.strictEqual(res1.body.data.length, 2);

  // 2. Search with rooms=2 should return only Deluxe (since Suite has only 1 active room)
  const res2 = await request(app)
    .get('/api/v1/rooms/availability')
    .query({ checkIn: ci, checkOut: co, rooms: 2, adults: 4 });

  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.body.data.length, 1);
  assert.strictEqual(res2.body.data[0].roomType.name, 'Deluxe King');

  // 3. Filter by minPrice=5000 should return only Suite
  const res3 = await request(app)
    .get('/api/v1/rooms/availability')
    .query({ checkIn: ci, checkOut: co, rooms: 1, minPrice: 5000 });

  assert.strictEqual(res3.status, 200);
  assert.strictEqual(res3.body.data.length, 1);
  assert.strictEqual(res3.body.data[0].roomType.name, 'Executive Suite');
});
