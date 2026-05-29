const { v4: uuidv4 } = require('uuid');
const { Order, OrderItem, Cart, CartItem, Product, sequelize } = require('../models');

const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { shippingAddress, notes } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Complete shipping address is required.' });
    }

    const cart = await Cart.findOne({
      where: { userId: req.session.userId },
      include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product' }] }],
      transaction: t,
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // Validate stock and compute totals
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Product "${item.productName || item.productId}" is no longer available.` });
      }
      if (item.product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for "${item.product.name}".` });
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax — adjust as needed
    const shippingCost = subtotal >= 100 ? 0 : 9.99;
    const total = subtotal + tax + shippingCost;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: req.session.userId,
      shippingAddress,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      total: total.toFixed(2),
      notes: notes || null,
    }, { transaction: t });

    // Create order items & decrement stock
    const orderItems = await Promise.all(cart.items.map((item) =>
      OrderItem.create({
        orderId: order.id,
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: (parseFloat(item.product.price) * item.quantity).toFixed(2),
      }, { transaction: t })
    ));

    await Promise.all(cart.items.map((item) =>
      item.product.update({ stock: item.product.stock - item.quantity }, { transaction: t })
    ));

    // Clear cart
    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: { ...order.toJSON(), items: orderItems },
    });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Order.findAndCountAll({
      where: { userId: req.session.userId },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    return next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.session.userId },
      include: [{ model: OrderItem, as: 'items' }],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ where: { id: req.params.id, userId: req.session.userId } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage.' });
    }
    await order.update({ status: 'cancelled' });
    return res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { createOrder, getOrders, getOrderById, cancelOrder };
