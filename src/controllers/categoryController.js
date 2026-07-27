const { Category, Product } = require('../models');

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true, parentId: null })
      .populate({ path: 'subcategories', match: { isActive: true } })
      .sort({ name: 1 });
    return res.json({ success: true, data: categories });
  } catch (err) {
    return next(err);
  }
};

const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate({ path: 'subcategories' });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.json({ success: true, data: category });
  } catch (err) {
    return next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, parentId, imageUrl } = req.body;
    const category = await Category.create({ name, slug, description, parentId, imageUrl });
    return res.status(201).json({ success: true, message: 'Category created.', data: category });
  } catch (err) {
    return next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    Object.assign(category, req.body);
    await category.save();
    return res.json({ success: true, message: 'Category updated.', data: category });
  } catch (err) {
    return next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    category.isActive = false;
    await category.save();
    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAllCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
