const { Category, Product } = require('../models');

const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true, parentId: null },
      include: [{ model: Category, as: 'subcategories', where: { isActive: true }, required: false }],
      order: [['name', 'ASC']],
    });
    return res.json({ success: true, data: categories });
  } catch (err) {
    return next(err);
  }
};

const getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      where: { slug: req.params.slug, isActive: true },
      include: [{ model: Category, as: 'subcategories', required: false }],
    });
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
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    await category.update(req.body);
    return res.json({ success: true, message: 'Category updated.', data: category });
  } catch (err) {
    return next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    await category.update({ isActive: false });
    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getAllCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
