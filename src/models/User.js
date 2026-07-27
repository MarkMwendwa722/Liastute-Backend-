const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required.'],
    maxlength: 100,
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required.'],
    maxlength: 100,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please provide a valid email.'],
    maxlength: 255,
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    maxlength: 255,
  },
  phone: {
    type: String,
    maxlength: 20,
    trim: true,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
