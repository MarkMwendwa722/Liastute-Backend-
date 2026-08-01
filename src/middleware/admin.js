const { User } = require('../models');
const { verifyToken } = require('../utils/jwt');

const isAdmin = async (req, res, next) => {
  try {
    let userId = req.session && req.session.userId;

    if (!userId) {
      // Fall back to Bearer token
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        try {
          const payload = verifyToken(token);
          userId = payload.id;
        } catch (err) {
          return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
        }
      }
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const user = await User.findById(userId).select('role isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or inactive.' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { isAdmin };
