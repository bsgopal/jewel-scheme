const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    register,
    login,
    verifyOTP,
    resendOTP,
    getMe,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    verifyForgotPasswordOTP,
    resendForgotPasswordOTP,
    resetPasswordByUserId,
    logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation rules
const registerValidation = [
    body().custom((value, { req }) => {
        if (!(req.body.name || req.body.firstname)) {
            throw new Error('Name is required');
        }
        return true;
    }),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body().custom((value, { req }) => {
        const phone = req.body.phone || req.body.mobile;
        if (!/^[6-9]\d{9}$/.test(phone || '')) {
            throw new Error('Please provide a valid 10-digit phone number');
        }
        return true;
    }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password-otp', verifyForgotPasswordOTP);
router.post('/forgot-password-resend', resendForgotPasswordOTP);
router.post('/forgot-password-reset', resetPasswordByUserId);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/logout', protect, logout);

module.exports = router;
