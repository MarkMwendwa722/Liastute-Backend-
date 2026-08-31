const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/adminController');
const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  toggleProductStatus,
} = require('../controllers/productController');
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
} = require('../controllers/categoryController');
const { isAdmin } = require('../middleware/admin');
const upload = require('../middleware/upload');
const { createProductValidator } = require('../validators/productValidator');

router.use(isAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);

// Products (admin CRUD)
router.get('/products', getAdminProducts);
router.post('/products', upload.array('images', 10), createProductValidator, createProduct);
router.put('/products/:id', upload.array('images', 10), updateProduct);
router.patch('/products/:id/toggle-status', toggleProductStatus);
router.delete('/products/:id', deleteProduct);

// Categories (admin CRUD)
router.get('/categories', getAllCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;
