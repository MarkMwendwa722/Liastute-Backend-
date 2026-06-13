const { body } = require('express-validator');

const sendEmailValidator = [
  body('to')
    .trim()
    .notEmpty().withMessage('Recipient email is required.')
    .isEmail().withMessage('A valid recipient email is required.')
    .normalizeEmail(),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required.')
    .isLength({ max: 255 }).withMessage('Subject must not exceed 255 characters.'),

  // At least one of html or text must be present — cross-field check is done in the controller.
  body('html')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('HTML content must be a string.')
    .isLength({ max: 100_000 }).withMessage('HTML content is too large.'),

  body('text')
    .optional({ nullable: true, checkFalsy: true })
    .isString().withMessage('Text content must be a string.')
    .isLength({ max: 20_000 }).withMessage('Text content is too large.'),

  body('replyTo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('A valid reply-to email is required.')
    .normalizeEmail(),

  body('name')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isString()
    .isLength({ max: 100 }).withMessage('Sender name must not exceed 100 characters.'),
];

module.exports = { sendEmailValidator };
