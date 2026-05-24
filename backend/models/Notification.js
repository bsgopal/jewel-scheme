const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
        index: true
    },
    type: {
        type: String,
        enum: ['payment_due', 'payment_overdue', 'payment_reminder', 'payment_success', 'scheme_matured', 'scheme_redeemed'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date
    },
    daysOverdue: {
        type: Number,
        default: 0
    },
    amount: {
        type: Number
    },
    read: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    lastReminderSent: {
        type: Date
    },
    reminderCount: {
        type: Number,
        default: 0
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    metadata: {
        schemeId: String,
        schemeName: String,
        installmentNumber: Number
    }
}, {
    timestamps: true
});

// Index for finding unread notifications
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Index for finding reminders that need to be sent
notificationSchema.index({ type: 1, lastReminderSent: 1, reminderCount: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
