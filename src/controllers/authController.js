const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../models');

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });
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

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
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
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    req.session.userId = user.id;
    req.session.userRole = user.role;

    return res.json({
      success: true,
      message: 'Login successful.',
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
    const user = await User.findByPk(req.session.userId, {
      attributes: { exclude: ['password'] },
    });
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
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await user.update({ firstName, lastName, phone, address });
    const { password: _pwd, ...userData } = user.toJSON();
    return res.json({ success: true, message: 'Profile updated.', user: userData });
  } catch (err) {
    return next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.session.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashed });
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    return next(err);
  }
};

module.exports = { register, login, logout, getProfile, updateProfile, changePassword };
