const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

/**
 * GET /api/notifications/unread
 * Get count of unread notifications
 */
router.get('/unread', protect, async (req, res, next) => {
    try {
        const userId = req.user._id;
        const unreadCount = await Notification.countDocuments({
            user: userId,
            read: false
        });

        res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', protect, async (req, res, next) => {
    try {
        const { limit = 20, skip = 0 } = req.query;
        const userId = req.user._id;

        const result = await notificationService.getUserNotifications(
            userId,
            parseInt(limit),
            parseInt(skip)
        );

        res.status(200).json({
            success: true,
            data: result.notifications,
            total: result.total,
            unread: result.unread
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', protect, async (req, res, next) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { user: userId, read: false },
            { read: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/notifications/delete-all
 * Delete all notifications
 */
router.delete('/delete-all', protect, async (req, res, next) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ user: userId });

        res.status(200).json({
            success: true,
            message: 'All notifications deleted'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', protect, async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        // Verify notification belongs to user
        const notification = await Notification.findOne({
            _id: notificationId,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        const updated = await notificationService.markAsRead(notificationId);

        res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
