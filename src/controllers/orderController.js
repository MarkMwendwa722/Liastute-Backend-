const mongoose = require('mongoose');
const { Order, OrderItem, Cart, CartItem, Product, User } = require('../models');
const { sendOrderNotification } = require('./emailController');

const generateOrderNumber = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { shippingAddress, notes, sourceUrl, orderUrl, from } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.country) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Complete shipping address is required.' });
    }

    const cart = await Cart.findOne({ userId: req.session.userId })
      .session(session)
      .populate({
        path: 'items',
        populate: { path: 'product' },
      });

    if (!cart || !cart.items || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // Validate stock and compute totals
    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Product "${item.productId}" is no longer available.` });
      }
      if (item.product.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Insufficient stock for "${item.product.name}".` });
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax — adjust as needed
    const shippingCost = subtotal >= 100 ? 0 : 9.99;
    const total = subtotal + tax + shippingCost;

    const [order] = await Order.create([{
      orderNumber: generateOrderNumber(),
      userId: req.session.userId,
      shippingAddress,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      notes: notes || null,
    }], { session });

    // Create order items & decrement stock
    const orderItems = await Promise.all(cart.items.map((item) =>
      OrderItem.create([{
        orderId: order._id,
        productId: item.product._id,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: parseFloat((parseFloat(item.product.price) * item.quantity).toFixed(2)),
      }], { session })
    ));

    await Promise.all(cart.items.map((item) =>
      Product.updateOne(
        { _id: item.product._id },
        { $inc: { stock: -item.quantity } },
        { session }
      )
    ));

    // Clear cart
    await CartItem.deleteMany({ cartId: cart._id }, { session });

    await session.commitTransaction();
    session.endSession();

    let emailNotificationSent = false;
    try {
      const user = await User.findById(req.session.userId).select('firstName lastName email phone');

      await sendOrderNotification({
        order,
        items: orderItems.map(([o]) => o),
        user,
        sourceUrl: sourceUrl || orderUrl || from,
      });
      emailNotificationSent = true;
    } catch (emailErr) {
      console.error('Order notification email failed:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: { ...order.toObject(), items: orderItems.map(([o]) => o), emailNotificationSent },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, rows] = await Promise.all([
      Order.countDocuments({ userId: req.session.userId }),
      Order.find({ userId: req.session.userId })
        .populate('items')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.session.userId }).populate('items');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    return res.json({ success: true, data: order });
  } catch (err) {
    return next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.session.userId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage.' });
    }
    order.status = 'cancelled';
    await order.save();
    return res.json({ success: true, message: 'Order cancelled.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { createOrder, getOrders, getOrderById, cancelOrder };
