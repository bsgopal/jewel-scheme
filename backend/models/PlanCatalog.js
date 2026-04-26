const mongoose = require('mongoose');

const planCatalogSchema = new mongoose.Schema({
    groupCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: ''
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    planType: {
        type: String,
        trim: true,
        default: 'Monthly'
    },
    schemeType: {
        type: String,
        enum: ['monthly', 'flexible', 'one-time'],
        default: 'monthly'
    },
    jewelleryType: {
        type: String,
        trim: true,
        default: 'All'
    },
    minAmount: {
        type: Number,
        required: true,
        min: 1
    },
    maxAmount: {
        type: Number,
        min: 1
    },
    totalInstallments: {
        type: Number,
        default: 11,
        min: 1
    },
    tenure: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    features: {
        type: [String],
        default: []
    },
    terms: {
        type: [String],
        default: []
    },
    benefits: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    bonusPercentage: {
        type: Number,
        default: 0
    },
    priority: {
        type: Number,
        default: 1
    },
    imageUrl: {
        type: String,
        trim: true,
        default: ''
    },
    popular: {
        type: Boolean,
        default: false
    },
    isFlexible: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PlanCatalog', planCatalogSchema);
