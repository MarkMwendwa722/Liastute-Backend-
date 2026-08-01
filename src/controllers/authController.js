const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { signToken } = require('../utils/jwt');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashed,
      phone: phone || null,
    });

    req.session.userId = user.id;
    req.session.userRole = user.role;

    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
    });
  } catch (err) {
    return next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role },
    });
  } catch (err) {
    return next(err);
  }
};

const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('liastute.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, user });
  } catch (err) {
    return next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, phone, address } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    Object.assign(user, { firstName, lastName, phone, address });
    await user.save();
    const { password: _pwd, ...userData } = user.toObject();
    return res.json({ success: true, message: 'Profile updated.', user: userData });
  } catch (err) {
    return next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, logout, getProfile, updateProfile, changePassword };
