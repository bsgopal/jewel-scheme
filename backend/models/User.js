const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    customerId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number'],
        unique: true,
        match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian phone number']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: 'Tamil Nadu' },
        pincode: { type: String, default: '' },
        landmark: { type: String, default: '' }
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },
    aadharNumber: {
        type: String,
        match: [/^\d{12}$/, 'Please provide a valid 12-digit Aadhar number']
    },
    panNumber: {
        type: String,
        uppercase: true,
        match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please provide a valid PAN number']
    },
    profileImage: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'staff', 'agent'],
        default: 'customer'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    otp: {
        type: String,
        select: false
    },
    otpExpiry: {
        type: Date,
        select: false
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralCount: {
        type: Number,
        default: 0
    },
    referralBonus: {
        type: Number,
        default: 0
    },
    totalGoldWeight: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSavings: {
        type: Number,
        default: 0,
        min: 0
    },
    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    walletGoldBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    preferredBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    assignedBranch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    agentProfile: {
        area: { type: String, default: '' },
        commissionRate: { type: Number, default: 0 },
        notes: { type: String, default: '' },
        collectionAmounts: { type: Array, default: [] },      // ← add
        defaultCollectionAmount: { type: Number, default: null },    // ← add
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // references another User with role: 'agent'
        default: null
    },
    notifications: {
        sms: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true }
    },
    lastLogin: {
        type: Date
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for schemes
userSchema.virtual('schemes', {
    ref: 'Scheme',
    localField: '_id',
    foreignField: 'user',
    justOne: false
});

// Generate Customer ID before saving
userSchema.pre('save', async function(next) {
    if (this.isNew) {
        const year = new Date().getFullYear().toString().slice(-2);
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        this.customerId = `JWL${year}${timestamp}${random}`;
    }
    next();
});

// Generate referral code
userSchema.pre('save', function (next) {
    if (this.isNew && !this.referralCode) {
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.referralCode = `REF${this.phone.slice(-4)}${randomStr}`;
    }
    next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }

    next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Generate OTP
userSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp = otp;
    this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    this.otpAttempts = 0;
    return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (enteredOTP) {
    if (this.otpAttempts >= 5) {
        return { valid: false, message: 'Too many attempts. Please request new OTP.' };
    }

    if (new Date() > this.otpExpiry) {
        return { valid: false, message: 'OTP has expired. Please request new OTP.' };
    }

    if (this.otp !== enteredOTP) {
        this.otpAttempts += 1;
        return { valid: false, message: 'Invalid OTP. Please try again.' };
    }

    return { valid: true };
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
