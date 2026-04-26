const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    imageUrl: {
        type: String,
        trim: true,
        default: ''
    },
    ctaLabel: {
        type: String,
        trim: true,
        default: ''
    },
    ctaRoute: {
        type: String,
        trim: true,
        default: ''
    },
    targetRoles: {
        type: [String],
        default: []
    },
    active: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 1
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Banner', bannerSchema);
