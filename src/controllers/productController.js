const { validationResult } = require('express-validator');
const { Product, Category } = require('../models');

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

    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
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
      updates.images = req.files.map((f) => `/uploads/${f.filename}`);
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    product.isActive = false;
    await product.save();
    return res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAllProducts, getProductById, getProductBySlug, createProduct, updateProduct, deleteProduct };
