const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');

const isAuthenticated = async (req, res, next) => {
  // 1. Session-based auth (existing)
  if (req.session && req.session.userId) {
    return next();
  }

  // 2. Token-based auth (Bearer token)
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or inactive.' });
    }
    req.user = user;
    req.token = token;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = { isAuthenticated };
