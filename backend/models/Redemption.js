const mongoose = require('mongoose');

const redemptionItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true
    },
    itemCode: String,
    category: {
        type: String,
        enum: ['Necklace', 'Ring', 'Earring', 'Bangle', 'Chain', 'Pendant', 'Coin', 'Bar', 'Bracelet', 'Anklet', 'Other'],
        required: true
    },
    subcategory: String,
    grossWeight: {
        type: Number,
        required: true
    },
    netWeight: {
        type: Number,
        required: true
    },
    goldPurity: {
        type: String,
        enum: ['22K', '24K', '18K'],
        default: '22K'
    },
    stoneWeight: {
        type: Number,
        default: 0
    },
    stoneCharges: {
        type: Number,
        default: 0
    },
    makingCharges: {
        type: Number,
        default: 0
    },
    makingChargePerGram: {
        type: Number,
        default: 0
    },
    makingChargeDiscount: {
        type: Number,
        default: 0
    },
    wastagePercentage: {
        type: Number,
        default: 0
    },
    wastageCharges: {
        type: Number,
        default: 0
    },
    wastageDiscount: {
        type: Number,
        default: 0
    },
    hallmarkCharges: {
        type: Number,
        default: 50
    },
    goldValue: {
        type: Number,
        required: true
    },
    gst: {
        type: Number,
        default: 0
    },
    finalPrice: {
        type: Number,
        required: true
    },
    images: [String]
}, { _id: true });

const redemptionSchema = new mongoose.Schema({
    redemptionId: {
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
    goldWeightAvailable: {
        type: Number,
        required: true
    },
    goldWeightUsed: {
        type: Number,
        required: true
    },
    goldWeightRemaining: {
        type: Number,
        default: 0
    },
    goldRateAtRedemption: {
        type: Number,
        required: true
    },
    goldValueUsed: {
        type: Number,
        required: true
    },
    items: [redemptionItemSchema],
    totalItemsValue: {
        type: Number,
        required: true
    },
    totalMakingCharges: {
        type: Number,
        default: 0
    },
    totalMakingChargeDiscount: {
        type: Number,
        default: 0
    },
    totalStoneCharges: {
        type: Number,
        default: 0
    },
    totalGST: {
        type: Number,
        default: 0
    },
    additionalAmountRequired: {
        type: Number,
        default: 0
    },
    additionalAmountPaid: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ['Cash', 'UPI', 'NetBanking', 'DebitCard', 'CreditCard', 'Mixed']
    },
    billNumber: {
        type: String,
        trim: true,
        default: ''
    },
    billingAmount: {
        type: Number,
        default: 0
    },
    paymentTransactionId: String,
    refundAmount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    branch: {
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch'
        },
        branchName: String,
        branchCode: String,
        address: String,
        phone: String
    },
    status: {
        type: String,
        enum: ['requested', 'approved', 'processing', 'ready', 'delivered', 'cancelled', 'rejected'],
        default: 'requested',
        index: true
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    approvalDate: Date,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processingDate: Date,
    readyDate: Date,
    deliveryDate: Date,
    deliveredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledDate: Date,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: String,
    otp: String,
    otpExpiry: Date,
    otpVerified: {
        type: Boolean,
        default: false
    },
    deliveryType: {
        type: String,
        enum: ['pickup', 'delivery'],
        default: 'pickup'
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        contactPhone: String
    },
    trackingNumber: String,
    remarks: String,
    customerFeedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        feedbackDate: Date
    },
    documents: [{
        type: { type: String },
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Generate Redemption ID before validation
redemptionSchema.pre('validate', async function(next) {
    if (this.isNew && !this.redemptionId) {
        const count = await mongoose.model('Redemption').countDocuments();
        const timestamp = Date.now().toString(36).toUpperCase();
        this.redemptionId = `RDM${timestamp}${String(count + 1).padStart(5, '0')}`;
        
        // Calculate remaining gold weight
        this.goldWeightRemaining = Math.max(0, this.goldWeightAvailable - this.goldWeightUsed);
    }
    next();
});

// Generate OTP for delivery verification
redemptionSchema.methods.generateDeliveryOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp = otp;
    this.otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    return otp;
};

module.exports = mongoose.model('Redemption', redemptionSchema);
