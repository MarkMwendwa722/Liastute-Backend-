const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/', createOrder);
router.get('/', isAuthenticated, getOrders);
router.get('/:id', isAuthenticated, getOrderById);
router.patch('/:id/cancel', isAuthenticated, cancelOrder);

module.exports = router;
