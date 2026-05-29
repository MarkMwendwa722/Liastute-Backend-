const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryBySlug } = require('../controllers/categoryController');

// Public category routes
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

module.exports = router;
