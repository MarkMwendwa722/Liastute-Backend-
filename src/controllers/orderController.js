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
    const { name, townCity, phoneNumber, emailAddress, specialNotes, items: guestItems, sourceUrl, orderUrl, from } = req.body;

    if (!name || !townCity || !phoneNumber || !emailAddress) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Name, town/city, phone number, and email address are required.' });
    }

    // Determine cart items — from logged-in user's cart OR from guest items in body
    let cartItems;
    const userId = req.session?.userId || null;

    if (userId) {
      const cart = await Cart.findOne({ userId })
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
      cartItems = cart.items;

      // Clear cart after use
      await CartItem.deleteMany({ cartId: cart._id }, { session });
    } else {
      // Guest checkout — items must be provided in the body
      if (!guestItems || !Array.isArray(guestItems) || guestItems.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: 'Items array is required for guest checkout.' });
      }

      // Fetch products for guest items
      const productIds = guestItems.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = {};
      for (const p of products) productMap[p._id.toString()] = p;

      cartItems = [];
      for (const gi of guestItems) {
        const product = productMap[gi.productId];
        if (!product || !product.isActive) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `Product "${gi.productId}" is no longer available.` });
        }
        if (product.stock < gi.quantity) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ success: false, message: `Insufficient stock for "${product.name}".` });
        }
        cartItems.push({ product, quantity: gi.quantity });
      }
    }

    // Validate stock and compute totals
    for (const item of cartItems) {
      if (!item.product || !item.product.isActive) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Product is no longer available.` });
      }
      if (item.product.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: `Insufficient stock for "${item.product.name}".` });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax — adjust as needed
    const shippingCost = subtotal >= 100 ? 0 : 9.99;
    const total = subtotal + tax + shippingCost;

    const [order] = await Order.create([{
      orderNumber: generateOrderNumber(),
      userId,
      shippingAddress: {
        name,
        townCity,
        phoneNumber,
        emailAddress,
        specialNotes: specialNotes || null,
      },
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      notes: specialNotes || null,
    }], { session });

    // Create order items & decrement stock
    const orderItems = await Promise.all(cartItems.map((item) =>
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

    await Promise.all(cartItems.map((item) =>
      Product.updateOne(
        { _id: item.product._id },
        { $inc: { stock: -item.quantity } },
        { session }
      )
    ));

    await session.commitTransaction();
    session.endSession();

    let emailNotificationSent = false;
    try {
      const user = userId ? await User.findById(userId).select('firstName lastName email phone') : null;

      if (user) {
        await sendOrderNotification({
          order,
          items: orderItems.map(([o]) => o),
          user,
          sourceUrl: sourceUrl || orderUrl || from,
        });
        emailNotificationSent = true;
      }
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
