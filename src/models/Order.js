const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // The order number (e.g. "LIA-346757") is the primary key.
  // MongoDB's default _id index is already unique, so no unique:true here.
  _id: {
    type: String,
    required: [true, 'Order ID is required.'],
    maxlength: 50,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required.'],
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: [true, 'Total is required.'],
  },
  name: {
    type: String,
    required: [true, 'Customer name is required.'],
    trim: true,
  },
  townCity: {
    type: String,
    required: [true, 'Town/city is required.'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required.'],
    trim: true,
  },
  emailAddress: {
    type: String,
    required: [true, 'Email address is required.'],
    trim: true,
    lowercase: true,
  },
  notes: {
    type: String,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

orderSchema.virtual('items', {
  ref: 'OrderItem',
  localField: '_id',
  foreignField: 'orderId',
});

// The order number is the primary key (_id); expose it under the familiar
// `orderNumber` name so existing code and API responses keep working.
orderSchema.virtual('orderNumber').get(function () {
  return this._id;
});

// Prevent permanent deletion — use status update instead
orderSchema.pre('deleteOne', { document: true, query: false }, () => {
  throw new Error('Orders cannot be deleted. Use status updates (e.g., "cancelled" or "refunded") instead.');
});

orderSchema.pre('deleteMany', () => {
  throw new Error('Orders cannot be deleted. Use status updates (e.g., "cancelled" or "refunded") instead.');
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
