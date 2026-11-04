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

  const receptionist = await User.create({ name: 'R', email: 'r@checkout.test', password: 'Test@1234', role: 'receptionist' });
  const admin = await User.create({ name: 'A', email: 'a@checkout.test', password: 'Test@1234', role: 'admin' });
  const guest = await Guest.create({ fullName: 'G', phone: '1', email: 'g@g.com' });
  const rt = await RoomType.create({ name: 'Std', baseRate: 2500, capacity: 2 });
  const room = await Room.create({ number: '555', floor: 1, roomType: rt._id });

  const ci = new Date(Date.now() - 2 * 86400000);
  const co = new Date(Date.now() + 1 * 86400000);
  ci.setHours(12, 0, 0, 0); co.setHours(12, 0, 0, 0);

  const resv = await Reservation.create({
    reservationCode: 'RES-CHECKOUT-01', guest: guest._id, room: room._id,
    createdBy: admin._id, checkIn: ci, checkOut: co,
    adults: 1, ratePerNight: 2500, nights: 3, totalAmount: 7500, status: 'checked_in',
  });

  const rToken = jwt.sign({ id: receptionist._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const aToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { resv, receptionist, admin, rToken, aToken };
}

test('Check-out blocked when balance > 0', async () => {
  const { resv, rToken } = await setup();
  const res = await request(app)
    .patch(`/api/v1/reservations/${resv._id}/check-out`)
    .set('Authorization', `Bearer ${rToken}`);
  assert.equal(res.status, 409, `Should be 409 for unpaid balance: ${res.text}`);
  assert.ok(res.body.message.includes('balance'), `Message should mention balance: ${res.body.message}`);
});

test('Check-out allowed after full payment', async () => {
  const { resv, rToken, aToken } = await setup();

  // Pay the full amount
  const payRes = await request(app)
    .post('/api/v1/payments')
    .set('Authorization', `Bearer ${rToken}`)
    .send({ reservationId: resv._id.toString(), amount: 7500, method: 'cash' });
  assert.equal(payRes.status, 201, `Payment failed: ${payRes.text}`);

  // Now checkout should succeed
  const coRes = await request(app)
    .patch(`/api/v1/reservations/${resv._id}/check-out`)
    .set('Authorization', `Bearer ${rToken}`);
  assert.equal(coRes.status, 200, `Checkout should succeed after payment: ${coRes.text}`);
  assert.equal(coRes.body.data.status, 'checked_out');
});

test('Payment amount cannot exceed outstanding balance', async () => {
  const { resv, rToken } = await setup();

  const res = await request(app)
    .post('/api/v1/payments')
    .set('Authorization', `Bearer ${rToken}`)
    .send({ reservationId: resv._id.toString(), amount: 99999, method: 'cash' });
  assert.equal(res.status, 400, `Overpayment should return 400: ${res.text}`);
  assert.ok(res.body.message.includes('balance'), `Message should mention balance: ${res.body.message}`);
});

