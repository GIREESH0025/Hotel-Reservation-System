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

async function getToken(role) {
  const User = require('../src/models/User.model');
  const jwt = require('jsonwebtoken');
  const user = await User.create({ name: `${role} User`, email: `${role}@roles.test`, password: 'Test@1234', role });
  return { token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }), user };
}

test('Receptionist cannot access admin-only user list', async () => {
  const { token } = await getToken('receptionist');
  const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('Customer cannot access receptionist-only room list', async () => {
  const { token } = await getToken('customer');
  const res = await request(app).get('/api/v1/rooms').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('Unauthenticated request to protected route returns 401', async () => {
  const res = await request(app).get('/api/v1/users');
  assert.equal(res.status, 401);
});

test('Customer cannot delete a room type (admin-only)', async () => {
  const { token } = await getToken('customer');
  const res = await request(app).delete('/api/v1/room-types/000000000000000000000001').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('Receptionist cannot delete a user (admin-only)', async () => {
  const { token } = await getToken('receptionist');
  const res = await request(app).delete('/api/v1/users/000000000000000000000001').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

