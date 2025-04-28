const { body, param } = require('express-validator');

const validateUsername = body('username')
  .trim()
  .isLength({ min: 3, max: 10 }).withMessage('Username should be between 3 and 30 characters')
  .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores');

const validatePassword = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain at least one number')
  .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character');

const validateBio = body('bio')
  .optional()
  .isLength({ max: 500 }).withMessage('Bio should not exceed 500 characters');

const validatePostTitle = body('title')
  .trim()
  .isLength({ min: 3, max: 100 }).withMessage('Title should be between 3 and 100 characters');

const validatePostContent = body('content')
  .trim()
  .isLength({ min: 10, max: 2000 }).withMessage('Content should be between 10 and 2000 characters');

const validateAccountNumber = param('accountNumber')
  .isNumeric().withMessage('Account number must be numeric')
  .isLength({ min: 10, max: 10 }).withMessage('Account number must be 10 digits long');

module.exports = {
  validateUsername,
  validatePassword,
  validateBio,
  validatePostTitle,
  validatePostContent,
  validateAccountNumber
};
