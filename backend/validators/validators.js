const { body, param, query } = require('express-validator');

// ─── Auth Validators ────────────────────────────────────────────
exports.registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid 10-digit Indian mobile number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.loginValidation = [
    body('phone').notEmpty().withMessage('Mobile number is required'),
    body('password').notEmpty().withMessage('Password is required')
];

exports.verifyOTPValidation = [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits').isNumeric().withMessage('OTP must be numeric')
];

exports.forgotPasswordValidation = [
    body('phone').notEmpty().withMessage('Mobile number is required')
];

exports.resetPasswordValidation = [
    body('phone').notEmpty().withMessage('Mobile number is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// ─── Scheme Validators ──────────────────────────────────────────
exports.createSchemeValidation = [
    body('schemeName').notEmpty().withMessage('Scheme name is required'),
    body('monthlyAmount').isNumeric().withMessage('Monthly amount must be a number').isFloat({ min: 100 }).withMessage('Minimum amount is ₹100')
];

exports.payInstallmentValidation = [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
];

// ─── Payment Validators ─────────────────────────────────────────
exports.createOrderValidation = [
    body('amount').isFloat({ min: 100 }).withMessage('Minimum payment is ₹100'),
    body('schemeId').notEmpty().withMessage('Scheme ID is required')
];

// ─── Gold Rate Validators ────────────────────────────────────────
exports.goldRateValidation = [
    body('gold22K').isFloat({ min: 1 }).withMessage('22K gold rate is required'),
    body('gold24K').isFloat({ min: 1 }).withMessage('24K gold rate is required'),
    body('gold18K').isFloat({ min: 1 }).withMessage('18K gold rate is required'),
    body('silver').isFloat({ min: 1 }).withMessage('Silver rate is required')
];
