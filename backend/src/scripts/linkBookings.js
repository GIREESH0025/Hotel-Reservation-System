'use strict';
/**
 * linkBookings.js
 * Backfill script: links existing reservations and guests to customers.
 * Idempotent: safe to run multiple times.
 * Dry-run by default. Pass --apply to write changes to the database.
 *
 * Usage:
 *   node src/scripts/linkBookings.js          # Dry run
 *   node src/scripts/linkBookings.js --apply  # Apply changes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Guest = require('../models/Guest.model');
const Reservation = require('../models/Reservation.model');
const connectDB = require('../config/db');

const isApply = process.argv.includes('--apply');

async function run() {
  console.log(`\n======================================================`);
  console.log(`[Backfill] Link Customer Bookings`);
  console.log(`Mode: ${isApply ? '>>> APPLY CHANGES <<<' : '>>> DRY RUN (pass --apply to write) <<<'}`);
  console.log(`======================================================\n`);

  await connectDB();

  const customers = await User.find({ role: 'customer' });
  console.log(`Found ${customers.length} customer account(s).`);

  let guestsLinked = 0;
  let reservationsLinked = 0;

  for (const customer of customers) {
    console.log(`\nProcessing Customer: ${customer.name} <${customer.email}> (${customer._id})`);

    // 1. Find or create linked guest
    let guest = await Guest.findOne({ user: customer._id });
    if (!guest) {
      guest = await Guest.findOne({ email: { $regex: new RegExp(`^${customer.email}$`, 'i') } });
      if (guest) {
        console.log(`  -> Found existing Guest "${guest.fullName}" (${guest._id}) without user link. Linking to customer.`);
        if (isApply) {
          guest.user = customer._id;
          await guest.save();
        }
        guestsLinked++;
      } else {
        console.log(`  -> No guest record found for customer. Creating one.`);
        if (isApply) {
          guest = await Guest.create({
            fullName: customer.name,
            email: customer.email,
            phone: customer.phone || '',
            user: customer._id,
          });
        }
        guestsLinked++;
      }
    } else {
      console.log(`  -> Guest record already linked: ${guest._id}`);
    }

    const guestId = guest ? guest._id : null;

    // 2. Find all reservations matching customer._id by createdBy or guest email
    const allGuestsForEmail = await Guest.find({
      email: { $regex: new RegExp(`^${customer.email}$`, 'i') },
    }).select('_id');
    const guestIdList = allGuestsForEmail.map((g) => g._id);
    if (guestId && !guestIdList.some((id) => id.toString() === guestId.toString())) {
      guestIdList.push(guestId);
    }

    const reservations = await Reservation.find({
      $or: [
        { createdBy: customer._id },
        { guest: { $in: guestIdList } },
      ],
    });

    console.log(`  -> Found ${reservations.length} reservation(s) associated with customer.`);

    for (const res of reservations) {
      let needsUpdate = false;
      const updates = {};

      // If createdBy is missing or not set to customer
      if (!res.createdBy || res.createdBy.toString() !== customer._id.toString()) {
        updates.createdBy = customer._id;
        needsUpdate = true;
      }

      // If guest is not set or not in guestIdList
      if (guestId && (!res.guest || !guestIdList.some((id) => id.toString() === res.guest.toString()))) {
        updates.guest = guestId;
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(`     [Link] Reservation ${res.reservationCode} (${res._id}) needs update:`, Object.keys(updates));
        if (isApply) {
          await Reservation.findByIdAndUpdate(res._id, updates);
        }
        reservationsLinked++;
      }
    }
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`Summary:`);
  console.log(`  Guests linked/created:       ${guestsLinked}`);
  console.log(`  Reservations linked/updated: ${reservationsLinked}`);
  console.log(`Status: ${isApply ? 'Applied successfully.' : 'Dry-run complete (no records changed).'}`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[Backfill Error]', err);
  process.exit(1);
});
