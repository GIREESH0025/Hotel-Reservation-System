'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Reservation = require('../models/Reservation.model');
const Room = require('../models/Room.model');

async function migrateRoomsArray({ dryRun = true } = {}) {
  console.log(`[MIGRATION] Starting rooms array migration (dryRun: ${dryRun})...`);

  const reservations = await Reservation.find({}).lean();
  let migratedCount = 0;
  let alreadyMigratedCount = 0;

  for (const res of reservations) {
    const hasRoomsArray = Array.isArray(res.rooms) && res.rooms.length > 0;
    const hasLegacyRoom = !!res.room;

    if (hasRoomsArray) {
      alreadyMigratedCount++;
      continue;
    }

    if (hasLegacyRoom) {
      const targetRooms = [res.room];
      let roomTypeId = res.roomType;

      if (!roomTypeId) {
        const roomDoc = await Room.findById(res.room).lean();
        if (roomDoc) roomTypeId = roomDoc.roomType;
      }

      if (!dryRun) {
        await Reservation.updateOne(
          { _id: res._id },
          {
            $set: {
              rooms: targetRooms,
              ...(roomTypeId ? { roomType: roomTypeId } : {}),
            },
          }
        );
      }
      migratedCount++;
    }
  }

  console.log(`[MIGRATION] Complete.`);
  console.log(`  Total reservations evaluated: ${reservations.length}`);
  console.log(`  Already using rooms[]:        ${alreadyMigratedCount}`);
  console.log(`  ${dryRun ? 'Needs migration (dry-run)' : 'Successfully migrated'}: ${migratedCount}`);

  return { total: reservations.length, migrated: migratedCount, alreadyMigrated: alreadyMigratedCount };
}

async function main() {
  const isApply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_reservation_system';

  if (uri === 'memory') {
    const { setupDB } = require('../../tests/helpers');
    await setupDB();
    console.log('[MIGRATION] Connected to in-memory store.');
  } else {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[MIGRATION] Connected to MongoDB.');
  }

  await migrateRoomsArray({ dryRun: !isApply });

  if (uri !== 'memory') {
    await mongoose.disconnect();
    console.log('[MIGRATION] Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[MIGRATION ERROR]', err);
    process.exit(1);
  });
}

module.exports = { migrateRoomsArray };
