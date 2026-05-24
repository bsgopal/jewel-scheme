const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - Authentication
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route. No token provided.'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password -otp -otpExpiry');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found with this token'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User account is deactivated'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        // Auth middleware error
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route. Invalid token.'
        });
    }
};

// Admin authorization
exports.admin = (req, res, next) => {
    return exports.authorize('admin')(req, res, next);
};

// Staff authorization (admin or staff)
exports.staff = (req, res, next) => {
    return exports.authorize('admin', 'staff')(req, res, next);
};

exports.authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (roles.includes(req.user.role)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${roles.join(', ')}`
    });
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password -otp -otpExpiry');
        } catch (error) {
            // Token invalid, but continue without user
            req.user = null;
        }
    }

    next();
};
