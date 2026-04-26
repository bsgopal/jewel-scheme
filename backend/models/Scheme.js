const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    installmentNumber: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    goldRate: {
        type: Number,
        required: true
    },
    goldWeight: {
        type: Number,
        required: true
    },
    bonusWeight: {
        type: Number,
        default: 0
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI', 'NetBanking', 'DebitCard', 'CreditCard', 'Razorpay', 'Initial'],
        required: true
    },
    transactionId: String,
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    }
}, { _id: true });

const schemeSchema = new mongoose.Schema({
    schemeId: {
        type: String,
        unique: true,
        sparse: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
        index: true
    },
    schemeName: {
        type: String,
        required: [true, 'Scheme name is required']
    },
    schemeType: {
        type: String,
        enum: ['monthly', 'flexible', 'one-time'],
        required: [true, 'Scheme type is required']
    },
    monthlyAmount: {
        type: Number,
        required: [true, 'Monthly amount is required'],
        min: [100, 'Minimum amount is ₹100']
    },
    totalInstallments: {
        type: Number,
        default: 11,
        min: 1,
        max: 24
    },
    paidInstallments: {
        type: Number,
        default: 0
    },
    pendingInstallments: {
        type: Number,
        default: 11
    },
    totalAmountPaid: {
        type: Number,
        default: 0
    },
    totalGoldWeight: {
        type: Number,
        default: 0
    },
    goldPurity: {
        type: String,
        enum: ['22K', '24K', '18K'],
        default: '22K'
    },
    bonusPercentage: {
        type: Number,
        default: 0
    },
    bonusGoldWeight: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    maturityDate: {
        type: Date
    },
    lastPaymentDate: {
        type: Date
    },
    nextDueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'matured', 'redeemed', 'cancelled', 'defaulted', 'paused'],
        default: 'active',
        index: true
    },
    installmentHistory: [installmentSchema],
    benefits: {
        makingChargeDiscount: { type: Number, default: 75 },
        wastageDiscount: { type: Number, default: 75 },
        diamondDiscount: { type: Number, default: 60 },
        extraBonusPercentage: { type: Number, default: 0 }
    },
    redemptionDetails: {
        isRedeemed: { type: Boolean, default: false },
        redeemedDate: Date,
        redemptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Redemption'
        },
        redeemedItems: [{
            itemName: String,
            itemWeight: Number,
            itemValue: Number
        }],
        totalValue: Number,
        branch: String
    },
    autoDebit: {
        enabled: { type: Boolean, default: false },
        bankAccount: String,
        ifscCode: String,
        mandateId: String
    },
    reminderEnabled: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        maxlength: 500
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for progress percentage
schemeSchema.virtual('progress').get(function() {
    return ((this.paidInstallments / this.totalInstallments) * 100).toFixed(1);
});

// Virtual for days remaining
schemeSchema.virtual('daysRemaining').get(function() {
    if (!this.maturityDate) return 0;
    const remaining = Math.ceil((this.maturityDate - new Date()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
});

// Virtual for is matured
schemeSchema.virtual('isMatured').get(function() {
    return new Date() >= this.maturityDate;
});

// Generate Scheme ID before validation
schemeSchema.pre('validate', async function(next) {
    if (this.isNew && !this.schemeId) {
        const count = await mongoose.model('Scheme').countDocuments();
        const prefix = this.schemeName ? this.schemeName.substring(0, 2).toUpperCase() : 'SC';
        const timestamp = Date.now().toString(36).toUpperCase();
        this.schemeId = `${prefix}${timestamp}${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Set dates before saving
schemeSchema.pre('save', function(next) {
    if (this.isNew) {
        // Set maturity date (330 days from start for 11-month scheme)
        const days = this.totalInstallments * 30;
        this.maturityDate = new Date(this.startDate.getTime() + (days * 24 * 60 * 60 * 1000));
        
        // Set first due date (30 days from start)
        this.nextDueDate = new Date(this.startDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        // Set pending installments
        this.pendingInstallments = this.totalInstallments;
    }
    
    // Update pending installments
    this.pendingInstallments = Math.max(0, this.totalInstallments - this.paidInstallments);
    next();
});

// Calculate bonus based on payment timeline
schemeSchema.methods.calculateBonus = function() {
    const daysSinceStart = Math.floor((Date.now() - this.startDate) / (24 * 60 * 60 * 1000));
    
    // Tiered bonus system (like Tamil Nadu jewellers)
    if (daysSinceStart <= 75) {
        return 1.25; // 1.25% bonus for early payments
    } else if (daysSinceStart <= 150) {
        return 1.0;
    } else if (daysSinceStart <= 225) {
        return 0.75;
    } else if (daysSinceStart <= 300) {
        return 0.5;
    }
    return 0;
};

// Check if payment is overdue
schemeSchema.methods.isOverdue = function() {
    if (this.status !== 'active') return false;
    return new Date() > this.nextDueDate;
};

// Get days overdue
schemeSchema.methods.getDaysOverdue = function() {
    if (!this.isOverdue()) return 0;
    return Math.floor((new Date() - this.nextDueDate) / (24 * 60 * 60 * 1000));
};

module.exports = mongoose.model('Scheme', schemeSchema);
