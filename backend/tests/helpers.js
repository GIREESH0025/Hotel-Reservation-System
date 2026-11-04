'use strict';
/**
 * In-memory test store & helpers for Express + Mongoose tests.
 * Runs instantly without downloading external binaries or requiring a live MongoDB server.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Set test environment variables
process.env.JWT_SECRET = 'test-secret-at-least-64-chars-long-for-testing-purposes-only-harbour-row';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';

// In-memory collections
const store = {
  users: [],
  rooms: [],
  roomtypes: [],
  guests: [],
  reservations: [],
  payments: [],
};

let originalMethods = {};

function createObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

// Simple query builder to emulate Mongoose chainable query
class MockQuery {
  constructor(collectionName, filter = {}) {
    this.coll = collectionName;
    this.filter = filter;
    this._sort = null;
    this._skip = 0;
    this._limit = Infinity;
    this._populates = [];
    this._isFindOne = false;
  }

  select() { return this; }
  populate(p) { this._populates.push(p); return this; }
  session() { return this; }
  lean() { return this; }
  sort(s) { this._sort = s; return this; }
  skip(n) { this._skip = n; return this; }
  limit(n) { this._limit = n; return this; }

  async exec() {
    let items = store[this.coll] || [];

    // Filter items
    items = items.filter((doc) => matchesFilter(doc, this.filter));

    if (this._isFindOne) {
      const doc = items[0] ? { ...items[0] } : null;
      if (!doc) return null;
      populateDoc(doc, this._populates);
      return attachDocMethods(this.coll, doc);
    }

    // Sort
    if (this._sort) {
      items = [...items];
    }

    // Pagination
    items = items.slice(this._skip, this._skip + this._limit);

    // Populate
    items = items.map((doc) => {
      const copy = { ...doc };
      populateDoc(copy, this._populates);
      return attachDocMethods(this.coll, copy);
    });

    return items;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const [key, val] of Object.entries(filter)) {
    const rawVal = doc[key];
    const docVal = (rawVal && typeof rawVal === 'object' && rawVal._id) ? rawVal._id : rawVal;

    if (key === '_id') {
      if (val && typeof val === 'object' && val.$ne) {
        if (String(docVal) === String(val.$ne)) return false;
        continue;
      }
      if (String(docVal) !== String(val)) return false;
      continue;
    }
    if (key === '$or' && Array.isArray(val)) {
      const orMatch = val.some((sub) => matchesFilter(doc, sub));
      if (!orMatch) return false;
      continue;
    }
    if (val && typeof val === 'object') {
      if (val.$in && Array.isArray(val.$in)) {
        if (!val.$in.map(String).includes(String(docVal))) return false;
        continue;
      }
      if (val.$gte !== undefined || val.$lte !== undefined || val.$lt !== undefined || val.$gt !== undefined) {
        const timeVal = docVal instanceof Date ? docVal.getTime() : docVal;
        if (val.$gte !== undefined) {
          const target = val.$gte instanceof Date ? val.$gte.getTime() : val.$gte;
          if (timeVal < target) return false;
        }
        if (val.$lte !== undefined) {
          const target = val.$lte instanceof Date ? val.$lte.getTime() : val.$lte;
          if (timeVal > target) return false;
        }
        if (val.$lt !== undefined) {
          const target = val.$lt instanceof Date ? val.$lt.getTime() : val.$lt;
          if (timeVal >= target) return false;
        }
        if (val.$gt !== undefined) {
          const target = val.$gt instanceof Date ? val.$gt.getTime() : val.$gt;
          if (timeVal <= target) return false;
        }
        continue;
      }
      if (val.$regex) {
        const regex = new RegExp(val.$regex, val.$options || '');
        if (!regex.test(docVal || '')) return false;
        continue;
      }
    }
    if (docVal !== val && String(docVal) !== String(val)) {
      return false;
    }
  }
  return true;
}

function populateDoc(doc, populates) {
  for (const p of populates) {
    const field = typeof p === 'string' ? p : p.path;
    if (field === 'guest' && doc.guest) {
      const gId = doc.guest?._id || doc.guest;
      const g = store.guests.find((x) => String(x._id) === String(gId));
      if (g) doc.guest = { ...g };
    } else if (field === 'room' && doc.room) {
      const rId = doc.room?._id || doc.room;
      const r = store.rooms.find((x) => String(x._id) === String(rId));
      if (r) {
        doc.room = { ...r };
        if (p.populate?.path === 'roomType' && r.roomType) {
          const rtId = r.roomType?._id || r.roomType;
          const rt = store.roomtypes.find((x) => String(x._id) === String(rtId));
          if (rt) doc.room.roomType = { ...rt };
        }
      }
    } else if (field === 'roomType' && doc.roomType) {
      const rtId = doc.roomType?._id || doc.roomType;
      const rt = store.roomtypes.find((x) => String(x._id) === String(rtId));
      if (rt) doc.roomType = { ...rt };
    } else if (field === 'createdBy' && doc.createdBy) {
      const uId = doc.createdBy?._id || doc.createdBy;
      const u = store.users.find((x) => String(x._id) === String(uId));
      if (u) doc.createdBy = { ...u };
    } else if (field === 'receivedBy' && doc.receivedBy) {
      const uId = doc.receivedBy?._id || doc.receivedBy;
      const u = store.users.find((x) => String(x._id) === String(uId));
      if (u) doc.receivedBy = { ...u };
    } else if (field === 'reservation' && doc.reservation) {
      const resId = doc.reservation?._id || doc.reservation;
      const r = store.reservations.find((x) => String(x._id) === String(resId));
      if (r) doc.reservation = { ...r };
    }
  }
}

function attachDocMethods(coll, doc) {
  doc.save = async function (opts) {
    const list = store[coll];
    const idx = list.findIndex((x) => String(x._id) === String(this._id));
    if (idx >= 0) {
      list[idx] = { ...this };
    } else {
      list.push({ ...this });
    }
    return this;
  };
  doc.populate = async function (p) {
    populateDoc(this, Array.isArray(p) ? p : [p]);
    return this;
  };
  if (coll === 'users') {
    doc.comparePassword = async function (plain) {
      if (!this.password) return false;
      return bcrypt.compare(plain, this.password);
    };
  }
  return doc;
}

function mockModel(ModelClass, collName) {
  originalMethods[collName] = {
    find: ModelClass.find,
    findOne: ModelClass.findOne,
    findById: ModelClass.findById,
    create: ModelClass.create,
    countDocuments: ModelClass.countDocuments,
    findByIdAndUpdate: ModelClass.findByIdAndUpdate,
    findByIdAndDelete: ModelClass.findByIdAndDelete,
    distinct: ModelClass.distinct,
    aggregate: ModelClass.aggregate,
  };

  ModelClass.find = function (filter = {}) {
    return new MockQuery(collName, filter);
  };

  ModelClass.findOne = function (filter = {}) {
    const q = new MockQuery(collName, filter);
    q._isFindOne = true;
    return q;
  };

  ModelClass.findById = function (id) {
    const q = new MockQuery(collName, { _id: id });
    q._isFindOne = true;
    return q;
  };

  ModelClass.create = async function (docOrArray, opts) {
    const isArray = Array.isArray(docOrArray);
    const docs = isArray ? docOrArray : [docOrArray];
    const created = [];

    for (let d of docs) {
      const id = d._id ? String(d._id) : createObjectId();
      const item = { ...d, _id: id, createdAt: new Date(), updatedAt: new Date() };

      if (collName === 'payments') {
        item.status = d.status || 'paid';
      }
      if (collName === 'reservations') {
        item.status = d.status || 'pending';
      }
      if (collName === 'rooms') {
        item.status = d.status || 'active';
      }
      if (collName === 'users') {
        item.role = d.role || 'customer';
        if (item.password && !item.password.startsWith('$2')) {
          const salt = await bcrypt.genSalt(10);
          item.password = await bcrypt.hash(item.password, salt);
        }
      }

      attachDocMethods(collName, item);
      store[collName].push(item);
      created.push(item);
    }
    return isArray ? created : created[0];
  };

  ModelClass.countDocuments = async function (filter = {}) {
    const items = (store[collName] || []).filter((doc) => matchesFilter(doc, filter));
    return items.length;
  };

  ModelClass.findByIdAndUpdate = async function (id, updates, opts = {}) {
    const list = store[collName] || [];
    const idx = list.findIndex((x) => String(x._id) === String(id));
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates, updatedAt: new Date() };
    const doc = { ...list[idx] };
    attachDocMethods(collName, doc);
    return doc;
  };

  ModelClass.findByIdAndDelete = async function (id) {
    const list = store[collName] || [];
    const idx = list.findIndex((x) => String(x._id) === String(id));
    if (idx === -1) return null;
    const [removed] = list.splice(idx, 1);
    return removed;
  };

  ModelClass.distinct = async function (field, filter = {}) {
    const items = (store[collName] || []).filter((doc) => matchesFilter(doc, filter));
    const vals = new Set();
    for (const item of items) {
      if (item[field]) vals.add(String(item[field]));
    }
    return Array.from(vals);
  };

  ModelClass.aggregate = async function (pipeline = []) {
    return [];
  };
}

let isSetup = false;

async function setupDB() {
  if (isSetup) return;

  // Mock Mongoose transactions
  mongoose.startSession = async () => ({
    startTransaction: () => {},
    commitTransaction: async () => {},
    abortTransaction: async () => {},
    endSession: () => {},
  });

  const User = require('../src/models/User.model');
  const Room = require('../src/models/Room.model');
  const RoomType = require('../src/models/RoomType.model');
  const Guest = require('../src/models/Guest.model');
  const Reservation = require('../src/models/Reservation.model');
  const Payment = require('../src/models/Payment.model');

  mockModel(User, 'users');
  mockModel(Room, 'rooms');
  mockModel(RoomType, 'roomtypes');
  mockModel(Guest, 'guests');
  mockModel(Reservation, 'reservations');
  mockModel(Payment, 'payments');

  isSetup = true;
}

async function teardownDB() {
  clearDB();
}

async function clearDB() {
  for (const k of Object.keys(store)) {
    store[k] = [];
  }
}

module.exports = { setupDB, teardownDB, clearDB, store };
