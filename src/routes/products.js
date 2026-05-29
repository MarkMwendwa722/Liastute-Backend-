const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, getProductBySlug } = require('../controllers/productController');

// Public product routes
router.get('/', getAllProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

module.exports = router;
