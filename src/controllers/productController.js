const { validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const { Product, Category, CartItem } = require('../models');

const uploadImageToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'liastute/products' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });

const uploadImagesToCloudinary = async (files) => {
  if (!files || files.length === 0) return [];
  const urls = await Promise.all(files.map(uploadImageToCloudinary));
  return urls;
};

// Best-effort: delete a product image from Cloudinary by its secure_url.
// Old local /uploads/... paths and malformed URLs are skipped.
const deleteCloudinaryImage = (url) => {
  const m =
    typeof url === 'string' &&
    url.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.(?:jpg|jpeg|png|webp)$/i);
  if (!m) return Promise.resolve();
  return cloudinary.uploader.destroy(m[1]).catch(() => {});
};

const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'DESC',
      featured,
    } = req.query;

    const filter = { isActive: true };
    if (category) filter.categoryId = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (featured === 'true') filter.isFeatured = true;

    const allowedSort = ['price', 'createdAt', 'name'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order.toUpperCase() === 'ASC' ? 1 : -1;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    return res.json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    return res.json({ success: true, data: product });
  } catch (err) {
    return next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const images = await uploadImagesToCloudinary(req.files);
    const product = await Product.create({ ...req.body, images });
    return res.status(201).json({ success: true, message: 'Product created.', data: product });
  } catch (err) {
    return next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updates = { ...req.body };
    if (req.files && req.files.length > 0) {
      updates.images = await uploadImagesToCloudinary(req.files);
    }

    Object.assign(product, updates);
    await product.save();
    return res.json({ success: true, message: 'Product updated.', data: product });
  } catch (err) {
    return next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Remove the deleted product from all users' carts (no dangling references).
    await CartItem.deleteMany({ productId: product._id });

    // Clean up the product's images from Cloudinary. Best-effort so the DB
    // deletion still succeeds even if image cleanup fails.
    Promise.all((product.images || []).map(deleteCloudinaryImage)).catch((err) =>
      console.error(`Cloudinary cleanup failed for product ${product._id}:`, err.message),
    );

    return res.json({ success: true, message: 'Product deleted permanently.' });
  } catch (err) {
    return next(err);
  }
};

// Admin product list — includes inactive products so the "Active" column can show true/false.
const getAdminProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status === 'true' || status === 'false') {
      filter.isActive = status === 'true';
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
};

const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    product.isActive = !product.isActive;
    await product.save();
    return res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'}.`,
      data: { id: product.id, isActive: product.isActive },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  toggleProductStatus,
};
