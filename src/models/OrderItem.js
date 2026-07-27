const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  productName: {
    type: String,
    required: [true, 'Product name is required.'],
    maxlength: 255,
    trim: true,
  },
  productSku: {
    type: String,
    maxlength: 100,
    default: null,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1.'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required.'],
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required.'],
  },
}, {
  timestamps: true,
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = OrderItem;
