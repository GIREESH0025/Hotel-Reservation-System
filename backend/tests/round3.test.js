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

  const admin = await User.create({ name: 'Admin', email: 'admin@r3.test', password: 'Admin@1234', role: 'admin' });
  const c1 = await User.create({ name: 'Rahul R3', email: 'rahul@r3.test', password: 'Cust@1234', role: 'customer' });
  const c2 = await User.create({ name: 'Sneha R3', email: 'sneha@r3.test', password: 'Cust@1234', role: 'customer' });

  const rt = await RoomType.create({ name: 'Harbour Suite', baseRate: 4000, capacity: 2, amenities: ['Wi-Fi'] });
  const room = await Room.create({ number: '801', floor: 8, roomType: rt._id, status: 'active' });

  const tokenC1 = jwt.sign({ id: c1._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const tokenC2 = jwt.sign({ id: c2._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const tokenAdmin = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return { admin, c1, c2, rt, room, tokenC1, tokenC2, tokenAdmin };
}

test('Customer books a room and it appears immediately in their reservations list', async () => {
  const { room, tokenC1 } = await setup();
  const ci = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // 1. Create reservation
  const bookRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ roomId: room._id.toString(), checkIn: ci, checkOut: co, adults: 2, notes: 'Sea view please' });

  assert.strictEqual(bookRes.status, 201);
  assert.strictEqual(bookRes.body.success, true);
  const createdResId = bookRes.body.data._id;
  assert.ok(createdResId);

  // 2. Fetch customer bookings
  const listRes = await request(app)
    .get('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`);

  assert.strictEqual(listRes.status, 200);
  assert.strictEqual(listRes.body.success, true);
  assert.ok(Array.isArray(listRes.body.data));
  const found = listRes.body.data.find((r) => r._id.toString() === createdResId.toString());
  assert.ok(found, 'Created reservation must appear in customer reservations list');
  assert.strictEqual(found.notes, 'Sea view please');
});

test('Another customer cannot see the first customer reservation in list or by ID', async () => {
  const { room, tokenC1, tokenC2 } = await setup();
  const ci = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0];

  const bookRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ roomId: room._id.toString(), checkIn: ci, checkOut: co, adults: 1 });

  const resId = bookRes.body.data._id;

  // Customer 2 lists reservations -> should not see C1's reservation
  const listRes = await request(app)
    .get('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC2}`);

  const found = listRes.body.data.find((r) => r._id.toString() === resId.toString());
  assert.strictEqual(found, undefined, 'Customer 2 must not see Customer 1 reservation');

  // Customer 2 tries direct GET -> 403 Forbidden
  const getRes = await request(app)
    .get(`/api/v1/reservations/${resId}`)
    .set('Authorization', `Bearer ${tokenC2}`);

  assert.strictEqual(getRes.status, 403);
});

test('Customer can see staff-created reservation that matches customer email', async () => {
  const { c1, room, tokenC1, tokenAdmin } = await setup();
  const Guest = require('../src/models/Guest.model');
  const Reservation = require('../src/models/Reservation.model');

  // Staff creates a guest with customer 1's email but without user link initially
  const walkInGuest = await Guest.create({
    fullName: 'Rahul Offline',
    email: c1.email,
    phone: '+91 99887 76655',
  });

  const ci = new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 22 * 86400000).toISOString().split('T')[0];

  const staffRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ guestId: walkInGuest._id.toString(), roomId: room._id.toString(), checkIn: ci, checkOut: co, adults: 1 });

  assert.strictEqual(staffRes.status, 201);
  const resId = staffRes.body.data._id;

  // Customer 1 logs in and lists reservations
  const custList = await request(app)
    .get('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`);

  const found = custList.body.data.find((r) => r._id.toString() === resId.toString());
  assert.ok(found, 'Customer must see reservations associated with their email address');
});

test('Customer pays 25% deposit online: moves reservation from pending to confirmed', async () => {
  const { room, tokenC1 } = await setup();
  const ci = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const bookRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ roomId: room._id.toString(), checkIn: ci, checkOut: co, adults: 2 });

  const resId = bookRes.body.data._id;
  assert.strictEqual(bookRes.body.data.status, 'pending');

  // Customer pays deposit
  const payRes = await request(app)
    .post(`/api/v1/reservations/${resId}/pay`)
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ amountType: 'deposit', method: 'demo_online' });

  assert.strictEqual(payRes.status, 201);
  assert.strictEqual(payRes.body.success, true);
  assert.strictEqual(payRes.body.financials.paymentStatus, 'partial');
  assert.strictEqual(payRes.body.financials.depositPaid, true);

  // Check reservation is now confirmed
  const checkRes = await request(app)
    .get(`/api/v1/reservations/${resId}`)
    .set('Authorization', `Bearer ${tokenC1}`);

  assert.strictEqual(checkRes.body.data.status, 'confirmed');
});

test('Duplicate payment request with same idempotencyKey is handled idempotently', async () => {
  const { room, tokenC1 } = await setup();
  const ci = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 17 * 86400000).toISOString().split('T')[0];

  const bookRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ roomId: room._id.toString(), checkIn: ci, checkOut: co, adults: 1 });

  const resId = bookRes.body.data._id;
  const key = `idem-key-${Date.now()}`;

  // First request
  const p1 = await request(app)
    .post(`/api/v1/reservations/${resId}/pay`)
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ amountType: 'deposit', method: 'demo_online', idempotencyKey: key });

  assert.strictEqual(p1.status, 201);

  // Duplicate request
  const p2 = await request(app)
    .post(`/api/v1/reservations/${resId}/pay`)
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ amountType: 'deposit', method: 'demo_online', idempotencyKey: key });

  assert.strictEqual(p2.status, 200);
  assert.strictEqual(p2.body.data.reference, p1.body.data.reference);
});

test('Customer payment failure is simulated if amount ends in .13', async () => {
  const paymentGateway = require('../src/services/paymentGateway');
  const result = await paymentGateway.processPayment({ amount: 1500.13 });
  assert.strictEqual(result.success, false);
  assert.match(result.message, /declined/i);
});

test('Folio invoice endpoint returns itemized charges and transactions', async () => {
  const { room, tokenC1 } = await setup();
  const ci = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 32 * 86400000).toISOString().split('T')[0];

  const bookRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ roomId: room._id.toString(), checkIn: ci, checkOut: co, adults: 2 });

  const resId = bookRes.body.data._id;

  const invRes = await request(app)
    .get(`/api/v1/reservations/${resId}/invoice`)
    .set('Authorization', `Bearer ${tokenC1}`);

  assert.strictEqual(invRes.status, 200);
  assert.strictEqual(invRes.body.success, true);
  assert.ok(invRes.body.data.invoiceNumber.startsWith('INV-'));
  assert.strictEqual(invRes.body.data.lineItems.length, 1);
  assert.strictEqual(invRes.body.data.financials.balance, 8000);
});

test('Cancellation >= 48 hours before check-in automatically creates a refund payment', async () => {
  const { room, tokenC1 } = await setup();
  // 5 days in the future
  const ci = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const co = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const bookRes = await request(app)
    .post('/api/v1/reservations')
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ roomId: room._id.toString(), checkIn: ci, checkOut: co, adults: 2 });

  const resId = bookRes.body.data._id;

  // Pay deposit
  await request(app)
    .post(`/api/v1/reservations/${resId}/pay`)
    .set('Authorization', `Bearer ${tokenC1}`)
    .send({ amountType: 'deposit', method: 'demo_online' });

  // Cancel reservation
  const cancelRes = await request(app)
    .patch(`/api/v1/reservations/${resId}/cancel`)
    .set('Authorization', `Bearer ${tokenC1}`);

  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.body.data.status, 'cancelled');

  // Verify refund payment was automatically recorded
  const { computeFinancials } = require('../src/services/reservation.service');
  const fin = await computeFinancials(resId);
  assert.ok(fin.refundedAmount > 0, 'Refunded amount must be greater than 0');
  assert.strictEqual(fin.paymentStatus, 'refunded');
});

