const { Cart, CartItem, Product } = require('../models');

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.session.userId })
      .populate({
        path: 'items',
        populate: { path: 'product', select: 'id name price images stock slug' },
      });

    if (!cart) {
      cart = await Cart.create({ userId: req.session.userId });
      cart.items = [];
    }

    const subtotal = (cart.items || []).reduce((sum, item) => sum + parseFloat(item.priceAtTime) * item.quantity, 0);

    return res.json({ success: true, data: cart, subtotal: subtotal.toFixed(2) });
  } catch (err) {
    return next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid product or quantity.' });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    let cart = await Cart.findOne({ userId: req.session.userId });
    if (!cart) cart = await Cart.create({ userId: req.session.userId });

    let item = await CartItem.findOne({ cartId: cart._id, productId });
    if (item) {
      const newQty = item.quantity + parseInt(quantity);
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: 'Insufficient stock.' });
      }
      item.quantity = newQty;
      item.priceAtTime = product.price;
      await item.save();
    } else {
      item = await CartItem.create({ cartId: cart._id, productId, quantity: parseInt(quantity), priceAtTime: product.price });
    }

    return res.status(201).json({ success: true, message: 'Item added to cart.', data: item });
  } catch (err) {
    return next(err);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }

    const cart = await Cart.findOne({ userId: req.session.userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const item = await CartItem.findOne({ _id: req.params.itemId, cartId: cart._id });
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    const product = await Product.findById(item.productId);
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    item.quantity = parseInt(quantity);
    await item.save();
    return res.json({ success: true, message: 'Cart item updated.', data: item });
  } catch (err) {
    return next(err);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.userId });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const item = await CartItem.findOne({ _id: req.params.itemId, cartId: cart._id });
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    await item.deleteOne();
    return res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    return next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.userId });
    if (cart) await CartItem.deleteMany({ cartId: cart._id });
    return res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
