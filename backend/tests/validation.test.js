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

async function getAdminToken() {
  const User = require('../src/models/User.model');
  const jwt = require('jsonwebtoken');
  const user = await User.create({ name: 'Admin', email: 'admin@val.test', password: 'Test@1234', role: 'admin' });
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

test('POST /auth/register — missing email returns 400', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({ name: 'Test', password: 'Test@1234' });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.some((e) => e.field === 'email'));
});

test('POST /auth/register — invalid email format returns 400', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({ name: 'Test', email: 'notanemail', password: 'Test@1234' });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.some((e) => e.field === 'email'));
});

test('POST /auth/register — short password returns 400', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({ name: 'Test', email: 'test@a.com', password: 'short' });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.some((e) => e.field === 'password'));
});

test('POST /auth/login — wrong password returns 401 with generic message', async () => {
  await request(app).post('/api/v1/auth/register').send({ name: 'T', email: 'x@x.com', password: 'Test@1234' });
  const res = await request(app).post('/api/v1/auth/login').send({ email: 'x@x.com', password: 'wrongpassword' });
  assert.equal(res.status, 401);
  // Should NOT reveal which field is wrong
  assert.ok(!res.body.message.toLowerCase().includes('password is wrong'));
});

test('POST /api/v1/room-types — missing baseRate returns 400', async () => {
  const token = await getAdminToken();
  const res = await request(app)
    .post('/api/v1/room-types')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'NoRate', capacity: 2 });
  assert.equal(res.status, 400);
});

test('POST /api/v1/reservations — checkOut before checkIn returns 400', async () => {
  const token = await getAdminToken();
  const User = require('../src/models/User.model');
  const Guest = require('../src/models/Guest.model');
  const RoomType = require('../src/models/RoomType.model');
  const Room = require('../src/models/Room.model');

  const admin = await User.findOne({ email: 'admin@val.test' });
  const guest = await Guest.create({ fullName: 'G', phone: '1', email: 'g@g.com' });
  const rt = await RoomType.create({ name: 'Std', baseRate: 2500, capacity: 2 });
  const room = await Room.create({ number: '111', floor: 1, roomType: rt._id });

  const res = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      guestId: guest._id.toString(),
      roomId: room._id.toString(),
      checkIn: '2025-12-10',
      checkOut: '2025-12-05', // before checkIn
      adults: 1,
    });
  assert.equal(res.status, 400);
});

