const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Offer title is required'],
        trim: true
    },
    subtitle: {
        type: String,
        default: '',
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    bonusValue: {
        type: Number,
        default: 0,
        min: 0
    },
    imageUrl: {
        type: String,
        default: ''
    },
    bannerUrl: {
        type: String,
        default: '',
        trim: true
    },
    pdfUrl: {
        type: String,
        default: '',
        trim: true
    },
    type: {
        type: String,
        enum: ['standard', 'banner', 'pdf'],
        default: 'standard'
    },
    validFrom: {
        type: Date,
        default: Date.now
    },
    validTo: {
        type: Date,
        required: [true, 'Offer end date is required']
    },
    targetRoles: [{
        type: String,
        enum: ['customer', 'admin', 'staff', 'agent']
    }],
    active: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);
