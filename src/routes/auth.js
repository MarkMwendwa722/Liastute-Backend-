const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, updateProfile, changePassword } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const { registerValidator, loginValidator, updateProfileValidator } = require('../validators/authValidator');

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/logout', isAuthenticated, logout);
router.get('/profile', isAuthenticated, getProfile);
router.put('/profile', isAuthenticated, updateProfileValidator, updateProfile);
router.put('/change-password', isAuthenticated, changePassword);

module.exports = router;
