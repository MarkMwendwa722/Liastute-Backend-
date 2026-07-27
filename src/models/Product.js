const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required.'],
    maxlength: 255,
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required.'],
    unique: true,
    maxlength: 300,
    trim: true,
  },
  description: {
    type: String,
    default: null,
  },
  price: {
    type: Number,
    required: [true, 'Price is required.'],
    min: [0, 'Price must be non-negative.'],
  },
  comparePrice: {
    type: Number,
    min: 0,
    default: null,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock must be non-negative.'],
  },
  sku: {
    type: String,
    maxlength: 100,
    unique: true,
    sparse: true,
    default: null,
  },
  imageUrl: {
    type: String,
    maxlength: 500,
    default: null,
  },
  images: {
    type: [String],
    default: [],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  brand: {
    type: String,
    maxlength: 255,
    default: null,
  },
  googleProductCategory: {
    type: String,
    default: null,
  },
  externalId: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  weight: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

productSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
