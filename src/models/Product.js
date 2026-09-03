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

/** Convert a product name into a URL-safe slug. */
const slugify = (str) =>
  String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // drop non-alphanumeric chars
    .replace(/[\s_-]+/g, '-') // collapse spaces/underscores/hyphens into one hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens

// Auto-generate slug from name when not provided, and guarantee uniqueness.
// Mongoose 9: async pre hooks must NOT use the `next` callback — throw instead.
productSchema.pre('validate', async function () {
  if (!this.slug) {
    this.slug = slugify(this.name);
  }
  if (!this.slug) {
    throw new Error('Unable to generate a slug from the product name.');
  }

  let base = this.slug;
  let slug = base;
  let counter = 1;
  while (await Product.exists({ slug, _id: { $ne: this._id } })) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  this.slug = slug;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
