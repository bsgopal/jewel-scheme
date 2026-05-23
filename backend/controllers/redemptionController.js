const Redemption = require('../models/Redemption');
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const {
    getCurrentRateWithRefresh,
    getRateForPurity
} = require('../services/goldRateFetcher');

// @desc    Create redemption request
// @route   POST /api/redemptions
// @access  Private
exports.createRedemption = async (req, res, next) => {
    try {
        const {
            schemeId, items, goldWeightUsed, goldRateAtRedemption, goldValueUsed,
            totalItemsValue, totalMakingCharges, totalMakingChargeDiscount,
            totalStoneCharges, totalGST, additionalAmountRequired, additionalAmountPaid,
            paymentMethod, paymentTransactionId, refundAmount, finalAmount,
            branch, deliveryType, deliveryAddress, remarks
        } = req.body;

        if (!schemeId || !goldWeightUsed || !finalAmount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide schemeId, goldWeightUsed, and finalAmount'
            });
        }

        // Verify scheme belongs to user and is eligible
        const scheme = await Scheme.findOne({
            _id: schemeId,
            user: req.user._id,
            status: { $in: ['matured', 'active'] }
        });

        if (!scheme) {
            return res.status(404).json({
                success: false,
                message: 'Eligible scheme not found. Scheme must be active or matured.'
            });
        }

        if (goldWeightUsed > scheme.totalGoldWeight) {
            return res.status(400).json({
                success: false,
                message: `Cannot redeem more than available gold weight (${scheme.totalGoldWeight.toFixed(4)}g)`
            });
        }

        // Get current gold rate if not provided
        const currentRate = await getCurrentRateWithRefresh();
        const rate = goldRateAtRedemption || getRateForPurity(currentRate, scheme.goldPurity);
        if (!rate) {
            return res.status(400).json({ success: false, message: 'Gold rate not available' });
        }

        const goldValue = goldValueUsed || parseFloat((goldWeightUsed * rate).toFixed(2));

        const redemption = await Redemption.create({
            user: req.user._id,
            scheme: schemeId,
            goldWeightAvailable: scheme.totalGoldWeight,
            goldWeightUsed,
            goldRateAtRedemption: rate,
            goldValueUsed: goldValue,
            items: items || [],
            totalItemsValue: totalItemsValue || goldValue,
            totalMakingCharges: totalMakingCharges || 0,
            totalMakingChargeDiscount: totalMakingChargeDiscount || 0,
            totalStoneCharges: totalStoneCharges || 0,
            totalGST: totalGST || 0,
            additionalAmountRequired: additionalAmountRequired || 0,
            additionalAmountPaid: additionalAmountPaid || 0,
            paymentMethod,
            paymentTransactionId,
            refundAmount: refundAmount || 0,
            finalAmount,
            branch,
            deliveryType: deliveryType || 'pickup',
            deliveryAddress,
            remarks
        });

        const populated = await Redemption.findById(redemption._id)
            .populate('scheme', 'schemeName schemeId goldPurity totalGoldWeight')
            .populate('user', 'name customerId phone email');

        res.status(201).json({
            success: true,
            message: 'Redemption request submitted successfully. You will be notified upon approval.',
            data: populated
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all redemptions for logged-in user
// @route   GET /api/redemptions
// @access  Private
exports.getUserRedemptions = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const query = { user: req.user._id };
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const redemptions = await Redemption.find(query)
            .populate('scheme', 'schemeName schemeId goldPurity')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Redemption.countDocuments(query);

        res.status(200).json({
            success: true,
            count: redemptions.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: redemptions
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get single redemption by ID
// @route   GET /api/redemptions/:id
// @access  Private
exports.getRedemptionById = async (req, res, next) => {
    try {
        const redemption = await Redemption.findOne({
            _id: req.params.id,
            user: req.user._id
        })
        .populate('scheme', 'schemeName schemeId goldPurity totalGoldWeight benefits')
        .populate('user', 'name customerId phone email address')
        .populate('approvedBy', 'name')
        .populate('deliveredBy', 'name')
        .populate('branch.branchId', 'branchName branchCode address phone');

        if (!redemption) {
            return res.status(404).json({ success: false, message: 'Redemption not found' });
        }

        res.status(200).json({ success: true, data: redemption });

    } catch (error) {
        next(error);
    }
};

// @desc    Cancel a redemption request (only if status is 'requested')
// @route   PUT /api/redemptions/:id/cancel
// @access  Private
exports.cancelRedemption = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const redemption = await Redemption.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!redemption) {
            return res.status(404).json({ success: false, message: 'Redemption not found' });
        }

        if (redemption.status !== 'requested') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel a redemption that is already '${redemption.status}'`
            });
        }

        redemption.status = 'cancelled';
        redemption.cancellationReason = reason || 'Cancelled by customer';
        redemption.cancelledDate = new Date();
        redemption.cancelledBy = req.user._id;
        await redemption.save();

        res.status(200).json({
            success: true,
            message: 'Redemption request cancelled successfully',
            data: redemption
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Submit customer feedback after delivery
// @route   PUT /api/redemptions/:id/feedback
// @access  Private
exports.submitFeedback = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Please provide a rating between 1 and 5' });
        }

        const redemption = await Redemption.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'delivered'
        });

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Delivered redemption not found. Feedback can only be submitted after delivery.'
            });
        }

        redemption.customerFeedback = {
            rating,
            comment: comment || '',
            feedbackDate: new Date()
        };
        await redemption.save();

        res.status(200).json({
            success: true,
            message: 'Thank you for your feedback!',
            data: redemption
        });

    } catch (error) {
        next(error);
    }
};
