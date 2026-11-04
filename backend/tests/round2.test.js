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
  const Guest = require('../src/models/Guest.model');
  const RoomType = require('../src/models/RoomType.model');
  const Room = require('../src/models/Room.model');
  const Reservation = require('../src/models/Reservation.model');
  const jwt = require('jsonwebtoken');

  const admin = await User.create({ name: 'Admin', email: 'admin@r2.test', password: 'Admin@1234', role: 'admin' });
  const c1 = await User.create({ name: 'Cust One', email: 'c1@r2.test', password: 'Cust@1234', role: 'customer' });
  const c2 = await User.create({ name: 'Cust Two', email: 'c2@r2.test', password: 'Cust@1234', role: 'customer' });

  const g1 = await Guest.create({ fullName: 'Cust One', phone: '999', email: 'c1@r2.test', user: c1._id });
  const g2 = await Guest.create({ fullName: 'Cust Two', phone: '888', email: 'c2@r2.test', user: c2._id });

  const rt = await RoomType.create({ name: 'Deluxe Suite', baseRate: 3500, capacity: 2, amenities: ['Wi-Fi'] });
  const room = await Room.create({ number: '701', floor: 7, roomType: rt._id, status: 'active' });

  const ci = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0];

  const r1 = await Reservation.create({
    reservationCode: 'RES-R2-0001', guest: g1._id, room: room._id,
    createdBy: admin._id, checkIn: new Date(ci), checkOut: new Date(co),
    adults: 2, ratePerNight: 3500, nights: 2, totalAmount: 7000, status: 'confirmed',
  });

  const tokenC1 = jwt.sign({ id: c1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const tokenC2 = jwt.sign({ id: c2._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return { admin, c1, c2, g1, g2, rt, room, r1, tokenC1, tokenC2 };
}

test('Public availability search succeeds without authorization token', async () => {
  await setup();
  const ci = new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 22 * 86400000).toISOString().split('T')[0];

  const res = await request(app)
    .get(`/api/v1/rooms/availability?checkIn=${ci}&checkOut=${co}&adults=2`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});

test('Public room types browsing succeeds without authorization token', async () => {
  await setup();
  const res = await request(app).get('/api/v1/room-types');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.length >= 1);
});

test('Customer cannot filter reservations by another guestId (IDOR blocked with 403)', async () => {
  const { g1, tokenC2 } = await setup();
  // Customer 2 attempts to query customer 1's guestId
  const res = await request(app)
    .get(`/api/v1/reservations?guestId=${g1._id}`)
    .set('Authorization', `Bearer ${tokenC2}`);

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

test('Customer password change: wrong current password returns 400', async () => {
  const { tokenC1 } = await setup();
  const res = await request(app)
    .patch('/api/v1/users/change-password')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ currentPassword: 'WrongPassword123', newPassword: 'NewSecurePassword@999' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('Customer password change: correct password updates and allows login with new password', async () => {
  const { c1, tokenC1 } = await setup();
  const res = await request(app)
    .patch('/api/v1/users/change-password')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ currentPassword: 'Cust@1234', newPassword: 'NewSecurePassword@999' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  // Verify login with new password succeeds
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: c1.email, password: 'NewSecurePassword@999' });

  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.body.data.token);
});

test('Illegal reservation status transition returns 409 Conflict', async () => {
  const { r1 } = await setup();
  // r1 is already 'confirmed'. Attempting to confirm again must return 409
  const res = await request(app)
    .patch(`/api/v1/reservations/${r1._id}/confirm`)
    .set('Authorization', `Bearer ${process.env.JWT_SECRET ? require('jsonwebtoken').sign({ id: (await require('../src/models/User.model').findOne({ role: 'admin' }))._id }, process.env.JWT_SECRET) : ''}`);

  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
});

