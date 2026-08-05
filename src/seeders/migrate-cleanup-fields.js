require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('../models');
const connectDB = require('../config/database');

/**
 * One-off migration: physically remove the obsolete `userId`, `shippingCost`
 * and `shippingAddress` fields from stored order documents.
 *
 * Uses the raw MongoDB collection because Mongoose's strict mode strips
 * `$unset` for paths that no longer exist on the schema (which is why the
 * earlier migrations reported success but left the fields in place).
 *
 * Usage:
 *   node src/seeders/migrate-cleanup-fields.js            # preview only
 *   node src/seeders/migrate-cleanup-fields.js --apply    # commit changes
 */
const FIELDS = ['userId', 'shippingCost', 'shippingAddress'];

const main = async () => {
  const apply = process.argv.includes('--apply');

  await connectDB();

  const filter = { $or: FIELDS.map((f) => ({ [f]: { $exists: true } })) };
  const count = await Order.collection.countDocuments(filter);

  console.log(`Found ${count} order(s) with one or more of: ${FIELDS.join(', ')}.\n`);

  if (count === 0) {
    console.log('Nothing to clean up — all order documents are already clean.');
    await mongoose.disconnect();
    return;
  }

  if (apply) {
    const res = await Order.collection.updateMany(filter, {
      $unset: { userId: 1, shippingCost: 1, shippingAddress: 1 },
    });
    console.log(`Done. ${res.modifiedCount} order(s) updated — removed ${FIELDS.join(', ')}.`);

    // Confirm
    const remaining = await Order.collection.countDocuments(filter);
    console.log(`Remaining documents still containing those fields: ${remaining}`);
  } else {
    const sample = await Order.collection.findOne(filter);
    console.log('Sample doc keys:', sample ? Object.keys(sample).join(', ') : 'none');
    console.log('\nPreview only. Re-run with --apply to commit.');
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
