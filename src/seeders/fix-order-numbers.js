require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('../models');
const connectDB = require('../config/database');

/**
 * One-off migration: re-number any order whose orderNumber is not in the
 * current "LIA-<6 digits>" format (e.g. old "ORD-...-..." numbers) so the
 * whole orders table matches the new format.
 *
 * Usage:
 *   node src/seeders/fix-order-numbers.js            # preview only (dry run)
 *   node src/seeders/fix-order-numbers.js --apply    # actually update the DB
 *
 * New numbers are assigned sequentially from the highest existing LIA number
 * so the unique index on orderNumber is never violated.
 */
const isNewFormat = (orderNumber) => /^LIA-\d+$/.test(orderNumber);

const main = async () => {
  const apply = process.argv.includes('--apply');

  await connectDB();

  const orders = await Order.find({}, { orderNumber: 1 }).sort({ createdAt: 1 }).lean();

  // Collect existing numbers + find the highest numeric LIA value
  const used = new Set(orders.map((o) => o.orderNumber));
  let maxNum = 0;
  for (const o of orders) {
    const m = /^LIA-(\d+)$/.exec(o.orderNumber);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }

  const toFix = orders.filter((o) => !isNewFormat(o.orderNumber));
  if (toFix.length === 0) {
    console.log('No orders need re-numbering — all orderNumbers already match the LIA format.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${toFix.length} order(s) with an old-format order number.\n`);
  console.log(`${apply ? 'APPLYING' : 'DRY RUN'} — run with --apply to commit.\n`);

  for (const order of toFix) {
    // Next sequential number, skipping anything already in use
    let candidate;
    do {
      maxNum += 1;
      candidate = `LIA-${String(maxNum).padStart(6, '0')}`;
    } while (used.has(candidate));

    used.add(candidate);

    if (apply) {
      await Order.updateOne({ _id: order._id }, { $set: { orderNumber: candidate } });
    }
    console.log(`  ${order.orderNumber.padEnd(20)} -> ${candidate}   (${order._id})`);
  }

  if (apply) {
    console.log(`\nDone. ${toFix.length} order(s) updated.`);
  } else {
    console.log('\nPreview only. Re-run with --apply to commit these changes.');
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
