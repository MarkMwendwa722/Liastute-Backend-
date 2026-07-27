const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required.'],
    unique: true,
    maxlength: 150,
    trim: true,
  },
  slug: {
    type: String,
    required: [true, 'Slug is required.'],
    unique: true,
    maxlength: 200,
    trim: true,
  },
  description: {
    type: String,
    default: null,
  },
  imageUrl: {
    type: String,
    maxlength: 500,
    default: null,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
