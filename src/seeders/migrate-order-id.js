require('dotenv').config();
const mongoose = require('mongoose');
const { Order, OrderItem } = require('../models');
const connectDB = require('../config/database');

/**
 * One-off migration: make the order number the primary key.
 *
 * Existing orders were stored with an ObjectId `_id` and a separate string
 * `orderNumber`. This script re-keys each order so `_id` = orderNumber
 * (e.g. "LIA-699551"), updates `OrderItem.orderId` to the new string id,
 * removes the obsolete `orderNumber` field/index, and deletes the old docs.
 *
 * Uses the raw MongoDB collection so Mongoose's delete hook / casting
 * doesn't interfere.
 *
 * Usage:
 *   node src/seeders/migrate-order-id.js            # preview only
 *   node src/seeders/migrate-order-id.js --apply    # commit changes
 */
const main = async () => {
  const apply = process.argv.includes('--apply');

  await connectDB();

  // Orders still keyed by ObjectId
  const orders = await Order.find({ _id: { $type: 'objectId' } }).lean();
  if (orders.length === 0) {
    console.log('No orders need re-keying — all orders already use the order number as _id.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${orders.length} order(s) still keyed by ObjectId.\n`);
  console.log(`${apply ? 'APPLYING' : 'DRY RUN'} — run with --apply to commit.\n`);

  if (apply) {
    // Drop the obsolete unique index on orderNumber BEFORE inserting re-keyed
    // docs, otherwise docs without an orderNumber field all collide on null.
    try {
      await Order.collection.dropIndex('orderNumber_1');
      console.log('Dropped obsolete unique index on orderNumber.\n');
    } catch (err) {
      console.log('No orderNumber_1 index to drop (or already removed).\n');
    }
  }

  for (const o of orders) {
    const oldId = o._id;
    const newId = o.orderNumber;

    if (!newId) {
      console.log(`  SKIP ${oldId} — no orderNumber to use as _id.`);
      continue;
    }

    // Build the re-keyed document (drop orderNumber/version fields)
    const { orderNumber, __v, _id, ...rest } = o;
    const newDoc = { ...rest, _id: newId, __v: 0 };

    if (apply) {
      // 1. Re-point order items to the new string id
      await OrderItem.collection.updateMany(
        { orderId: oldId },
        { $set: { orderId: newId } },
      );
      // 2. Insert the re-keyed order
      await Order.collection.insertOne(newDoc);
      // 3. Remove the old ObjectId-keyed order
      await Order.collection.deleteOne({ _id: oldId });
    }

    console.log(`  ${String(oldId).padEnd(26)} -> ${newId}`);
  }

  if (apply) {
    console.log(`Done. ${orders.length} order(s) re-keyed to the order number as _id.`);
  } else {
    console.log('\nPreview only. Re-run with --apply to commit these changes.');
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
