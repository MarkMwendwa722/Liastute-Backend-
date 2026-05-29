const { User } = require('../models');

const isAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const user = await User.findByPk(req.session.userId, { attributes: ['id', 'role', 'isActive'] });
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
