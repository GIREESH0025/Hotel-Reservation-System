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

  const admin = await User.create({ name: 'Admin', email: 'admin@own.test', password: 'Test@1234', role: 'admin' });
  const customer1 = await User.create({ name: 'C1', email: 'c1@own.test', password: 'Test@1234', role: 'customer' });
  const customer2 = await User.create({ name: 'C2', email: 'c2@own.test', password: 'Test@1234', role: 'customer' });

  const guest1 = await Guest.create({ fullName: 'C1 Guest', phone: '111', email: 'c1@own.test', user: customer1._id });
  const guest2 = await Guest.create({ fullName: 'C2 Guest', phone: '222', email: 'c2@own.test', user: customer2._id });

  const rt = await RoomType.create({ name: 'Standard', baseRate: 2500, capacity: 2 });
  const room = await Room.create({ number: '999', floor: 1, roomType: rt._id });

  const ci = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const resv = await Reservation.create({
    reservationCode: 'RES-TEST-0001', guest: guest1._id, room: room._id,
    createdBy: admin._id, checkIn: new Date(ci), checkOut: new Date(co),
    adults: 1, ratePerNight: 2500, nights: 2, totalAmount: 5000, status: 'confirmed',
  });

  const token1 = jwt.sign({ id: customer1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const token2 = jwt.sign({ id: customer2._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return { customer1, customer2, guest1, guest2, resv, token1, token2 };
}

test('Customer cannot read another customer\'s reservation', async () => {
  const { resv, token2 } = await setup();
  // customer2 tries to read customer1's reservation
  const res = await request(app)
    .get(`/api/v1/reservations/${resv._id}`)
    .set('Authorization', `Bearer ${token2}`);
  assert.ok([403, 404].includes(res.status), `Expected 403 or 404, got ${res.status}: ${res.text}`);
});

test('Customer can read their own reservation', async () => {
  const { resv, token1 } = await setup();
  const res = await request(app)
    .get(`/api/v1/reservations/${resv._id}`)
    .set('Authorization', `Bearer ${token1}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.reservationCode, 'RES-TEST-0001');
});

