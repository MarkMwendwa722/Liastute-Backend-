const { body } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('slug').optional().trim(),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
  body('comparePrice').optional().isFloat({ min: 0 }),
  body('sku').optional().trim(),
  // Google Merchant Centre feed requires these fields on every product so new
  // items can be advertised. Enforce them at creation time.
  body('description').trim().notEmpty().withMessage('Product description is required for Google Merchant.'),
  body('brand').trim().notEmpty().withMessage('Product brand is required for Google Merchant.'),
  body('googleProductCategory')
    .trim()
    .notEmpty()
    .withMessage('Google product category is required for Google Merchant.'),
];

module.exports = { createProductValidator };
