const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: [true, 'Order number is required.'],
    unique: true,
    maxlength: 50,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  shippingCost: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: [true, 'Total is required.'],
  },
  shippingAddress: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Shipping address is required.'],
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

orderSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
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
