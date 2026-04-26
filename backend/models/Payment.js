const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    paymentId: {
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
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
        required: [true, 'Scheme is required'],
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be greater than 0']
    },
    goldRateAtPayment: {
        type: Number,
        required: [true, 'Gold rate is required']
    },
    goldWeightCredited: {
        type: Number,
        required: [true, 'Gold weight is required']
    },
    bonusGoldWeight: {
        type: Number,
        default: 0
    },
    totalGoldWeight: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['UPI', 'NetBanking', 'DebitCard', 'CreditCard', 'Cash', 'Razorpay', 'BankTransfer', 'Cheque'],
        required: [true, 'Payment method is required']
    },
    transactionId: {
        type: String,
        sparse: true
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending',
        index: true
    },
    installmentNumber: {
        type: Number,
        required: true
    },
    invoiceNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    gstPercentage: {
        type: Number,
        default: 3
    },
    gstAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    failedAt: Date,
    failureReason: String,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiptUrl: String,
    notes: String,
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Generate Payment ID and Invoice Number before validation
paymentSchema.pre('validate', async function(next) {
    if (this.isNew) {
        const count = await mongoose.model('Payment').countDocuments();
        const timestamp = Date.now().toString(36).toUpperCase();
        
        if (!this.paymentId) {
            this.paymentId = `PAY${timestamp}${String(count + 1).padStart(6, '0')}`;
        }
        
        if (!this.invoiceNumber) {
            const year = new Date().getFullYear();
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            this.invoiceNumber = `INV${year}${month}${String(count + 1).padStart(6, '0')}`;
        }
        
        // Calculate total gold weight
        this.totalGoldWeight = this.goldWeightCredited + (this.bonusGoldWeight || 0);
    }
    next();
});

// Static method to get payment stats
paymentSchema.statics.getStats = async function(userId) {
    const stats = await this.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
        {
            $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                totalGoldWeight: { $sum: '$totalGoldWeight' },
                avgPayment: { $avg: '$amount' }
            }
        }
    ]);
    
    return stats[0] || { totalPayments: 0, totalAmount: 0, totalGoldWeight: 0, avgPayment: 0 };
};

module.exports = mongoose.model('Payment', paymentSchema);