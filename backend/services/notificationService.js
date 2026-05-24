const Notification = require('../models/Notification');
const Scheme = require('../models/Scheme');
const User = require('../models/User');

/**
 * Create or update a notification
 */
exports.createNotification = async (userId, type, title, message, schemeId = null, metadata = {}) => {
    try {
        const notification = await Notification.create({
            user: userId,
            scheme: schemeId,
            type,
            title,
            message,
            metadata
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

/**
 * Check and send payment reminders for all active schemes
 * Should be called every hour via cron job
 */
exports.checkAndSendPaymentReminders = async () => {
    try {
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        console.log(`[Notification] Checking payment reminders at ${now.toISOString()}`);

        // Find all active schemes with upcoming or overdue payments
        const schemes = await Scheme.find({
            status: 'active',
            reminderEnabled: true,
            nextDueDate: { $lte: twoDaysFromNow }
        }).populate('user');

        console.log(`[Notification] Found ${schemes.length} schemes with upcoming/overdue payments`);

        for (const scheme of schemes) {
            const daysUntilDue = Math.ceil((scheme.nextDueDate - now) / (24 * 60 * 60 * 1000));
            const isOverdue = daysUntilDue < 0;
            const daysOverdue = Math.abs(daysUntilDue);

            if (isOverdue) {
                // Payment is overdue - send immediate notification
                console.log(`[Notification] Scheme ${scheme.schemeId} is overdue by ${daysOverdue} days`);
                await handleOverduePayment(scheme);
            } else if (daysUntilDue <= 2) {
                // Payment due within 2 days - send hourly reminders
                console.log(`[Notification] Scheme ${scheme.schemeId} due in ${daysUntilDue} days`);
                await handleUpcomingPayment(scheme, daysUntilDue);
            }
        }

        console.log(`[Notification] Payment reminder check completed at ${now.toISOString()}`);
    } catch (error) {
        console.error('[Notification] Error in checkAndSendPaymentReminders:', error.message);
    }
};

/**
 * Handle overdue payment - send immediate notification
 */
async function handleOverduePayment(scheme) {
    try {
        const daysOverdue = scheme.getDaysOverdue();
        const installmentAmount = scheme.planAmount || scheme.monthlyAmount || 0;

        console.log(`[Notification] Processing overdue payment for scheme ${scheme.schemeId}`);

        // Check if we already have an overdue notification for this scheme
        let notification = await Notification.findOne({
            scheme: scheme._id,
            type: 'payment_overdue',
            read: false
        });

        if (!notification) {
            // Create new overdue notification
            notification = await Notification.create({
                user: scheme.user._id,
                scheme: scheme._id,
                type: 'payment_overdue',
                title: `⚠️ Payment Overdue - ${scheme.schemeName}`,
                message: `Your payment of Rs ${installmentAmount.toLocaleString('en-IN')} is ${daysOverdue} day(s) overdue. Please pay immediately to avoid penalties.`,
                dueDate: scheme.nextDueDate,
                daysOverdue: daysOverdue,
                amount: installmentAmount,
                notificationSent: true,
                metadata: {
                    schemeId: scheme.schemeId,
                    schemeName: scheme.schemeName,
                    installmentNumber: scheme.paidInstallments + 1
                }
            });

            console.log(`[Notification] Created overdue notification for scheme ${scheme.schemeId}`);

            // Send push notification to user
            await sendPushNotification(scheme.user._id, {
                title: notification.title,
                body: notification.message,
                data: {
                    type: 'payment_overdue',
                    schemeId: scheme._id.toString()
                }
            });
        } else {
            // Update existing notification with new days overdue
            notification.daysOverdue = daysOverdue;
            notification.lastReminderSent = new Date();
            notification.reminderCount = (notification.reminderCount || 0) + 1;
            await notification.save();
            console.log(`[Notification] Updated overdue notification for scheme ${scheme.schemeId}`);
        }
    } catch (error) {
        console.error(`[Notification] Error handling overdue payment for scheme ${scheme.schemeId}:`, error.message);
    }
}

/**
 * Handle upcoming payment - send hourly reminders for 2 days before due date
 */
async function handleUpcomingPayment(scheme, daysUntilDue) {
    try {
        const installmentAmount = scheme.planAmount || scheme.monthlyAmount || 0;
        const now = new Date();

        console.log(`[Notification] Processing upcoming payment for scheme ${scheme.schemeId} (${daysUntilDue} days until due)`);

        // Check if we already sent a reminder in the last hour
        const lastReminder = await Notification.findOne({
            scheme: scheme._id,
            type: 'payment_reminder',
            lastReminderSent: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }
        });

        if (lastReminder) {
            // Already sent a reminder in the last hour, skip
            console.log(`[Notification] Reminder already sent in last hour for scheme ${scheme.schemeId}, skipping`);
            return;
        }

        // Create or update reminder notification
        let notification = await Notification.findOne({
            scheme: scheme._id,
            type: 'payment_reminder',
            read: false
        });

        if (!notification) {
            notification = await Notification.create({
                user: scheme.user._id,
                scheme: scheme._id,
                type: 'payment_reminder',
                title: `📢 Payment Reminder - ${scheme.schemeName}`,
                message: `Your payment of Rs ${installmentAmount.toLocaleString('en-IN')} is due in ${daysUntilDue} day(s). Please pay before ${scheme.nextDueDate.toLocaleDateString('en-IN')}.`,
                dueDate: scheme.nextDueDate,
                amount: installmentAmount,
                lastReminderSent: now,
                reminderCount: 1,
                metadata: {
                    schemeId: scheme.schemeId,
                    schemeName: scheme.schemeName,
                    installmentNumber: scheme.paidInstallments + 1
                }
            });
            console.log(`[Notification] Created payment reminder for scheme ${scheme.schemeId}`);
        } else {
            // Update existing reminder
            notification.lastReminderSent = now;
            notification.reminderCount = (notification.reminderCount || 0) + 1;
            await notification.save();
            console.log(`[Notification] Updated payment reminder for scheme ${scheme.schemeId} (count: ${notification.reminderCount})`);
        }

        // Send push notification to user
        await sendPushNotification(scheme.user._id, {
            title: notification.title,
            body: notification.message,
            data: {
                type: 'payment_reminder',
                schemeId: scheme._id.toString()
            }
        });
    } catch (error) {
        console.error(`[Notification] Error handling upcoming payment for scheme ${scheme.schemeId}:`, error.message);
    }
}

/**
 * Send push notification to user (Firebase Cloud Messaging)
 * This is a placeholder - implement with your FCM setup
 */
async function sendPushNotification(userId, payload) {
    try {
        // TODO: Implement FCM push notification
        // For now, just log it
        console.log(`[Notification] Push notification queued for user ${userId}:`, payload);
        
        // In production, use Firebase Admin SDK:
        // const admin = require('firebase-admin');
        // const user = await User.findById(userId);
        // if (user && user.fcmToken) {
        //     await admin.messaging().send({
        //         token: user.fcmToken,
        //         notification: {
        //             title: payload.title,
        //             body: payload.body
        //         },
        //         data: payload.data
        //     });
        // }
    } catch (error) {
        console.error('[Notification] Error sending push notification:', error.message);
        // Don't throw - push notifications are non-critical
    }
}

/**
 * Mark notification as read
 */
exports.markAsRead = async (notificationId) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            {
                read: true,
                readAt: new Date()
            },
            { new: true }
        );
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return null;
    }
};

/**
 * Get user notifications
 */
exports.getUserNotifications = async (userId, limit = 20, skip = 0) => {
    try {
        const notifications = await Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('scheme', 'schemeName schemeId nextDueDate');

        const total = await Notification.countDocuments({ user: userId });
        const unread = await Notification.countDocuments({ user: userId, read: false });

        return { notifications, total, unread };
    } catch (error) {
        console.error('Error getting user notifications:', error);
        return { notifications: [], total: 0, unread: 0 };
    }
};

/**
 * Send payment success notification
 */
exports.sendPaymentSuccessNotification = async (userId, schemeId, amount, goldWeight) => {
    try {
        const scheme = await Scheme.findById(schemeId);
        if (!scheme) return;

        const notification = await Notification.create({
            user: userId,
            scheme: schemeId,
            type: 'payment_success',
            title: `✅ Payment Successful - ${scheme.schemeName}`,
            message: `Payment of Rs ${amount.toLocaleString('en-IN')} received. Gold credited: ${goldWeight.toFixed(4)}g`,
            amount: amount,
            notificationSent: true,
            metadata: {
                schemeId: scheme.schemeId,
                schemeName: scheme.schemeName,
                goldWeight: goldWeight
            }
        });

        // Send push notification
        await sendPushNotification(userId, {
            title: notification.title,
            body: notification.message,
            data: {
                type: 'payment_success',
                schemeId: schemeId.toString()
            }
        });

        return notification;
    } catch (error) {
        console.error('Error sending payment success notification:', error);
        return null;
    }
};

/**
 * Send scheme matured notification
 */
exports.sendSchemeMatureNotification = async (userId, schemeId) => {
    try {
        const scheme = await Scheme.findById(schemeId);
        if (!scheme) return;

        const notification = await Notification.create({
            user: userId,
            scheme: schemeId,
            type: 'scheme_matured',
            title: `🎉 Scheme Matured - ${scheme.schemeName}`,
            message: `Your scheme has matured! Total gold accumulated: ${scheme.totalGoldWeight.toFixed(4)}g. Visit the store to redeem.`,
            notificationSent: true,
            metadata: {
                schemeId: scheme.schemeId,
                schemeName: scheme.schemeName,
                totalGoldWeight: scheme.totalGoldWeight
            }
        });

        // Send push notification
        await sendPushNotification(userId, {
            title: notification.title,
            body: notification.message,
            data: {
                type: 'scheme_matured',
                schemeId: schemeId.toString()
            }
        });

        return notification;
    } catch (error) {
        console.error('Error sending scheme mature notification:', error);
        return null;
    }
};
