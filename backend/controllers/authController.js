const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendOTPEmail } = require('../utils/sendEmail');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const normalizedRole = ((req.body.role || 'customer') + '').toLowerCase();
        const supportedRole = ['admin', 'staff', 'agent', 'customer'].includes(normalizedRole)
            ? normalizedRole
            : 'customer';

        const name = req.body.name || req.body.firstname;
        const email = (req.body.email || '').toLowerCase();
        const phone = req.body.phone || req.body.mobile;
        const password = req.body.password;
        const address = typeof req.body.address === 'string'
            ? {
                street: req.body.address || '',
                area: req.body.area || '',
                city: req.body.city || '',
                state: req.body.state || 'Tamil Nadu',
                pincode: req.body.pincode || '',
                landmark: ''
            }
            : req.body.address;
        const nominee = {
            name: req.body.nominee?.name || req.body.nominee_name || '',
            phone: req.body.nominee?.phone || req.body.nominee_mobile || '',
            relation: req.body.nominee?.relation || req.body.nominee_relation || ''
        };
        const { dateOfBirth, gender, referralCode } = req.body;
        const isAdminCreate = Boolean(req.body.isSuperAdminCreate);

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { phone }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Phone number already registered'
            });
        }

        // Check referral code
        let referredBy = null;
        if (referralCode) {
            const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
            if (referrer) referredBy = referrer._id;
        }

        // Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
            address,
            nominee,
            dateOfBirth,
            gender,
            referredBy,
            role: isAdminCreate ? supportedRole : 'customer'
        });

        // Generate OTP and send via EMAIL
        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });

        try {
            await sendOTPEmail(user.email, otp, 'verification');
        } catch (emailError) {
            // OTP email error
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email with the OTP sent.',
            userId: user._id,
            data: {
                _id: user._id,
                customerId: user.customerId,
                name: user.name,
                email: user.email,
                phone: user.phone,
                referralCode: user.referralCode,
                requiresVerification: true
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP (received on email)
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
    try {
        const { email, userId, otp } = req.body;

        if ((!email && !userId) || !otp) {
            return res.status(400).json({ success: false, message: 'Email or user ID and OTP are required' });
        }

        const user = userId
            ? await User.findById(userId).select('+otp +otpExpiry')
            : await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const verifyResult = user.verifyOTP(otp);
        if (!verifyResult.valid) {
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ success: false, message: verifyResult.message });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        await user.save({ validateBeforeSave: false });

        // Credit referral bonus
        if (user.referredBy) {
            await User.findByIdAndUpdate(user.referredBy, { $inc: { referralCount: 1, referralBonus: 100 } });
        }

        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                _id: user._id, customerId: user.customerId, name: user.name,
                email: user.email, phone: user.phone, role: user.role,
                isVerified: user.isVerified, totalGoldWeight: user.totalGoldWeight,
                totalSavings: user.totalSavings, referralCode: user.referralCode, token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Resend OTP to email
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res, next) => {
    try {
        const { email, userId } = req.body;

        if (!email && !userId) return res.status(400).json({ success: false, message: 'Email address or user ID is required' });

        const user = userId
            ? await User.findById(userId)
            : await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });

        try {
            await sendOTPEmail(user.email, otp, 'verification');
        } catch (emailError) {
            // OTP email error
        }

        res.status(200).json({ success: true, message: 'OTP sent to your email address' });
    } catch (error) {
        next(error);
    }
};

// @desc    Login with phone number + password
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0]?.msg || 'Validation failed',
                errors: errors.array().map((item) => ({
                    field: item.path,
                    message: item.msg
                }))
            });
        }

        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ success: false, message: 'Please provide your phone number and password' });
        }

        // Find by phone number
        const user = await User.findOne({ phone }).select('+password');

        if (!user) return res.status(401).json({ success: false, message: 'Invalid phone number or password' });
        if (!user.isActive) return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid phone  number or password' });

        // If not verified, send OTP to email
        if (!user.isVerified) {
            const otp = user.generateOTP();
            await user.save({ validateBeforeSave: false });
            try {
                await sendOTPEmail(user.email, otp, 'verification');
            } catch (emailError) {
                // OTP email error
            }
            return res.status(403).json({
                success: false,
                message: 'Email not verified. A new OTP has been sent to your registered email.',
                requiresVerification: true,
                email: maskEmail(user.email),
                userId: user._id,
                rawEmail: user.email
            });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = user.getSignedJwtToken();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id, customerId: user.customerId, name: user.name,
                email: user.email, phone: user.phone, role: user.role,
                isVerified: user.isVerified, totalGoldWeight: user.totalGoldWeight,
                totalSavings: user.totalSavings, referralCode: user.referralCode,
                profileImage: user.profileImage, token
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('preferredBranch', 'branchName branchCode address phone');
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const allowedFields = ['name', 'email', 'address', 'dateOfBirth', 'gender', 'aadharNumber', 'panNumber', 'profileImage', 'notifications', 'preferredBranch', 'businessProfile'];
        const updateData = {};
        allowedFields.forEach(field => { if (req.body[field] !== undefined) updateData[field] = req.body[field]; });

        if (updateData.email) {
            const existingUser = await User.findOne({ email: updateData.email.toLowerCase(), _id: { $ne: req.user._id } });
            if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });
            updateData.email = updateData.email.toLowerCase();
        }

        if (updateData.businessProfile) {
            const currentUser = await User.findById(req.user._id).select('businessProfile');
            const mergedBusinessProfile = {
                ...(currentUser?.businessProfile?.toObject?.() || currentUser?.businessProfile || {}),
                ...updateData.businessProfile
            };

            if (Array.isArray(mergedBusinessProfile.featuredProducts)) {
                mergedBusinessProfile.featuredProducts = mergedBusinessProfile.featuredProducts
                    .map(item => `${item || ''}`.trim())
                    .filter(Boolean)
                    .slice(0, 12);
            }

            updateData.businessProfile = mergedBusinessProfile;
        }

        const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id).select('+password');
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

        user.password = newPassword;
        await user.save();

        const token = user.getSignedJwtToken();
        res.status(200).json({ success: true, message: 'Password updated successfully', token });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password — OTP sent to registered email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const phone = req.body.phone || req.body.mobile;

        if (!phone) return res.status(400).json({ success: false, message: 'Please provide your registered phone number' });

        const user = await User.findOne({ phone });
        if (!user) return res.status(404).json({ success: false, message: 'No account found with this phone number' });

        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });

        try {
            await sendOTPEmail(user.email, otp, 'password-reset');
        } catch (emailError) {
            // OTP email error
        }

        res.status(200).json({
            success: true,
            message: `Password reset OTP sent to your registered email (${maskEmail(user.email)})`,
            email: maskEmail(user.email),
            rawEmail: user.email,
            userId: user._id
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password using OTP received on email
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { phone, otp, newPassword } = req.body;

        if (!phone || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide phone number, OTP, and new password' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const user = await User.findOne({ phone }).select('+otp +otpExpiry');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const verifyResult = user.verifyOTP(otp);
        if (!verifyResult.valid) {
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ success: false, message: verifyResult.message });
        }

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        await user.save();

        const token = user.getSignedJwtToken();
        res.status(200).json({ success: true, message: 'Password reset successful', token });
    } catch (error) {
        next(error);
    }
};

exports.verifyForgotPasswordOTP = async (req, res, next) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'User ID and OTP are required' });
        }

        const user = await User.findById(userId).select('+otp +otpExpiry');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const verifyResult = user.verifyOTP(otp);
        if (!verifyResult.valid) {
            await user.save({ validateBeforeSave: false });
            return res.status(400).json({ success: false, message: verifyResult.message });
        }

        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        next(error);
    }
};

exports.resendForgotPasswordOTP = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const otp = user.generateOTP();
        await user.save({ validateBeforeSave: false });
        await sendOTPEmail(user.email, otp, 'password-reset');

        res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
        next(error);
    }
};

exports.resetPasswordByUserId = async (req, res, next) => {
    try {
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) {
            return res.status(400).json({ success: false, message: 'User ID and new password are required' });
        }

        const user = await User.findById(userId).select('+otp +otpExpiry');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpAttempts = 0;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    try {
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// Helper: mask email for privacy
function maskEmail(email) {
    if (!email) return '';
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
}
