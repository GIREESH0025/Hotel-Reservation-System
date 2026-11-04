'use strict';
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupDB, teardownDB, clearDB } = require('./helpers');

// Must set env before loading app
let app;

before(async () => {
  await setupDB();
  app = require('../src/app');
});

after(async () => {
  await teardownDB();
});

beforeEach(async () => {
  await clearDB();
});

// ── Helpers ───────────────────────────────────────────────────────────────
async function createUserAndLogin(role = 'admin') {
  const User = require('../src/models/User.model');
  const jwt = require('jsonwebtoken');
  const user = await User.create({
    name: `Test ${role}`,
    email: `${role}@test.com`,
    password: 'Test@1234',
    role,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, token };
}

async function createRoomType(overrides = {}) {
  const RoomType = require('../src/models/RoomType.model');
  return RoomType.create({ name: 'Standard', baseRate: 2500, capacity: 2, ...overrides });
}

async function createRoom(roomTypeId, overrides = {}) {
  const Room = require('../src/models/Room.model');
  return Room.create({ number: `${Math.floor(Math.random() * 900) + 100}`, floor: 1, roomType: roomTypeId, ...overrides });
}

async function createGuest(userId = null) {
  const Guest = require('../src/models/Guest.model');
  return Guest.create({ fullName: 'Test Guest', phone: '9999999999', email: 'guest@test.com', user: userId });
}

// ── OVERLAP TESTS ─────────────────────────────────────────────────────────

test('Overlap: creating a reservation on booked dates returns 409', async () => {
  const { token } = await createUserAndLogin('admin');
  const rt = await createRoomType();
  const room = await createRoom(rt._id);
  const guest = await createGuest();

  const checkIn = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const checkOut = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  // Create first reservation (should succeed)
  const res1 = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ guestId: guest._id.toString(), roomId: room._id.toString(), checkIn, checkOut, adults: 1 });

  assert.equal(res1.status, 201, `First reservation should be created: ${res1.text}`);

  // Try to create an overlapping reservation on the same room
  const res2 = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ guestId: guest._id.toString(), roomId: room._id.toString(), checkIn, checkOut, adults: 1 });

  assert.equal(res2.status, 409, `Overlapping reservation should return 409, got ${res2.status}: ${res2.text}`);
  assert.ok(res2.body.message.includes('not available'), `Message should mention availability: ${res2.body.message}`);
});

test('Overlap: partially overlapping dates return 409', async () => {
  const { token } = await createUserAndLogin('receptionist');
  const rt = await createRoomType({ name: 'Deluxe' });
  const room = await createRoom(rt._id, { number: '301' });
  const guest = await createGuest();

  const ci1 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const co1 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const ci2 = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]; // overlaps
  const co2 = new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0];

  await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ guestId: guest._id.toString(), roomId: room._id.toString(), checkIn: ci1, checkOut: co1, adults: 1 });

  const res = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ guestId: guest._id.toString(), roomId: room._id.toString(), checkIn: ci2, checkOut: co2, adults: 1 });

  assert.equal(res.status, 409);
});

test('Same-day turnover: checkout date == next checkin is allowed', async () => {
  const { token } = await createUserAndLogin('admin');
  const rt = await createRoomType({ name: 'Suite' });
  const room = await createRoom(rt._id, { number: '401' });
  const guest = await createGuest();

  const checkIn1 = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const checkOut1 = new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0];
  const checkIn2 = checkOut1; // Same day — should be allowed
  const checkOut2 = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const r1 = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ guestId: guest._id.toString(), roomId: room._id.toString(), checkIn: checkIn1, checkOut: checkOut1, adults: 1 });
  assert.equal(r1.status, 201, `First res: ${r1.text}`);

  const r2 = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({ guestId: guest._id.toString(), roomId: room._id.toString(), checkIn: checkIn2, checkOut: checkOut2, adults: 1 });
  assert.equal(r2.status, 201, `Same-day turnover should be allowed: ${r2.text}`);
});

