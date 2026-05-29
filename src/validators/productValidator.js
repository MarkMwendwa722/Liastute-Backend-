const { body } = require('express-validator');

const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('slug').trim().notEmpty().withMessage('Slug is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
  body('comparePrice').optional().isFloat({ min: 0 }),
  body('sku').optional().trim(),
];

module.exports = { createProductValidator };
