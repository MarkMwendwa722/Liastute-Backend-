const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

cartSchema.virtual('items', {
  ref: 'CartItem',
  localField: '_id',
  foreignField: 'cartId',
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
