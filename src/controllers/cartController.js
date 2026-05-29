const { Cart, CartItem, Product } = require('../models');

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({
      where: { userId: req.session.userId },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'images', 'stock', 'slug'] }],
        },
      ],
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

    const product = await Product.findOne({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    let cart = await Cart.findOne({ where: { userId: req.session.userId } });
    if (!cart) cart = await Cart.create({ userId: req.session.userId });

    let item = await CartItem.findOne({ where: { cartId: cart.id, productId } });
    if (item) {
      const newQty = item.quantity + parseInt(quantity);
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: 'Insufficient stock.' });
      }
      await item.update({ quantity: newQty, priceAtTime: product.price });
    } else {
      item = await CartItem.create({ cartId: cart.id, productId, quantity: parseInt(quantity), priceAtTime: product.price });
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

    const cart = await Cart.findOne({ where: { userId: req.session.userId } });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const item = await CartItem.findOne({ where: { id: req.params.itemId, cartId: cart.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    const product = await Product.findByPk(item.productId);
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock.' });
    }

    await item.update({ quantity: parseInt(quantity) });
    return res.json({ success: true, message: 'Cart item updated.', data: item });
  } catch (err) {
    return next(err);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.session.userId } });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const item = await CartItem.findOne({ where: { id: req.params.itemId, cartId: cart.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    await item.destroy();
    return res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    return next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.session.userId } });
    if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
    return res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
