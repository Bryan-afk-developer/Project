const { validationResult, body, param } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('first_name')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('First name must be between 2 and 100 characters'),
    body('last_name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Last name must be less than 100 characters'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Must be a valid phone number'),
    handleValidationErrors
];

/**
 * Validation rules for login
 */
const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

/**
 * Validation rules for creating/updating flowers
 */
const flowerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Flower name is required')
        .isLength({ min: 2, max: 255 })
        .withMessage('Name must be between 2 and 255 characters'),
    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required'),
    body('price')
        .isFloat({ min: 0.01 })
        .withMessage('Price must be a positive number'),
    body('category_id')
        .isInt({ min: 1 })
        .withMessage('Valid category is required'),
    body('image')
        .notEmpty()
        .withMessage('Image URL is required')
        .isURL()
        .withMessage('Must be a valid URL'),
    body('scientific_name')
        .optional()
        .trim(),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    handleValidationErrors
];

/**
 * Validation rules for creating orders
 */
const orderValidation = [
    body('flower_id')
        .isInt({ min: 1 })
        .withMessage('Valid flower ID is required'),
    body('quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('delivery_address')
        .trim()
        .notEmpty()
        .withMessage('Delivery address is required'),
    body('color_preference')
        .optional()
        .trim(),
    body('notes')
        .optional()
        .trim(),
    handleValidationErrors
];

/**
 * Validation for ID parameters
 */
const idValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid ID'),
    handleValidationErrors
];

module.exports = {
    registerValidation,
    loginValidation,
    flowerValidation,
    orderValidation,
    idValidation,
    handleValidationErrors
};
