const User = require('../models/User');
const Scheme = require('../models/Scheme');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');
const {
    getCurrentRateWithRefresh,
    getRateForPurity
} = require('../services/goldRateFetcher');

const ensureWallet = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;
    if (typeof user.walletBalance !== 'number') user.walletBalance = 0;
    if (typeof user.walletGoldBalance !== 'number') user.walletGoldBalance = 0;
    return user;
};

exports.getWallet = async (req, res, next) => {
    try {
        const userId = req.params.userId === 'self' ? req.user._id : req.params.userId;
        if (String(userId) !== String(req.user._id) && !['admin', 'staff'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const user = await ensureWallet(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            balance: user.walletBalance || 0,
            gold: user.walletGoldBalance || 0
        });
    } catch (error) {
        next(error);
    }
};

exports.addMoney = async (req, res, next) => {
    try {
        const userId = req.body.userId || req.user._id;
        if (String(userId) !== String(req.user._id) && !['admin', 'staff'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const amount = Number(req.body.amount || 0);
        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const user = await ensureWallet(userId);
        user.walletBalance = (user.walletBalance || 0) + amount;
        await user.save({ validateBeforeSave: false });

        await WalletTransaction.create({
            user: user._id,
            type: 'credit',
            amount,
            balanceAfter: {
                cash: user.walletBalance || 0,
                gold: user.walletGoldBalance || 0
            },
            remarks: req.body.remarks || 'Wallet top-up',
            createdBy: req.user._id
        });

        res.status(200).json({ success: true, balance: user.walletBalance, gold: user.walletGoldBalance || 0 });
    } catch (error) {
        next(error);
    }
};

exports.convertToGold = async (req, res, next) => {
    try {
        const userId = req.body.userId || req.user._id;
        const amount = Number(req.body.amount || 0);
        if (String(userId) !== String(req.user._id) && !['admin', 'staff'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const user = await ensureWallet(userId);
        if ((user.walletBalance || 0) < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        const rate = await getCurrentRateWithRefresh();
        const goldRate = getRateForPurity(rate, '22K');
        if (!goldRate) {
            return res.status(400).json({ success: false, message: 'Gold rate unavailable' });
        }

        const goldWeight = Number((amount / goldRate).toFixed(4));
        user.walletBalance -= amount;
        user.walletGoldBalance = Number(((user.walletGoldBalance || 0) + goldWeight).toFixed(4));
        await user.save({ validateBeforeSave: false });

        await WalletTransaction.create({
            user: user._id,
            type: 'convert',
            amount,
            goldWeight,
            balanceAfter: {
                cash: user.walletBalance || 0,
                gold: user.walletGoldBalance || 0
            },
            remarks: `Converted to gold at rate ${goldRate}`,
            createdBy: req.user._id
        });

        res.status(200).json({ success: true, balance: user.walletBalance, gold: user.walletGoldBalance, goldRate });
    } catch (error) {
        next(error);
    }
};

exports.getWalletHistory = async (req, res, next) => {
    try {
        const userId = req.params.userId === 'self' ? req.user._id : req.params.userId;
        if (String(userId) !== String(req.user._id) && !['admin', 'staff'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const history = await WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
        res.status(200).json(history.map((item) => ({
            id: item._id,
            type: item.type,
            amount: item.amount,
            gold: item.goldWeight,
            remarks: item.remarks,
            created_at: item.createdAt,
            balance_after: item.balanceAfter
        })));
    } catch (error) {
        next(error);
    }
};

exports.payInstallmentFromWallet = async (req, res, next) => {
    try {
        const { userId, schemeId, amount } = req.body;
        const numericAmount = Number(amount || 0);
        const targetUserId = userId || req.user._id;

        if (String(targetUserId) !== String(req.user._id) && !['admin', 'staff', 'agent'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (numericAmount < 100) {
            return res.status(400).json({ success: false, message: 'Minimum payment amount is Rs 100' });
        }

        const user = await ensureWallet(targetUserId);
        if ((user.walletBalance || 0) < numericAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        const scheme = await Scheme.findOne({ _id: schemeId, user: targetUserId });
        if (!scheme) {
            return res.status(404).json({ success: false, message: 'Scheme not found' });
        }
        if (scheme.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Only active schemes can receive payments' });
        }

        const isFlexible = scheme.schemeType === 'flexible';
        const totalPlanAmount = Number((scheme.planAmount || scheme.monthlyAmount || 0) * (scheme.totalInstallments || 1));
        const alreadyPaid   = Number(scheme.totalAmountPaid || 0);
        const remaining     = Math.max(0, totalPlanAmount - alreadyPaid);

        // For flexible plans: cap the payment at the remaining balance
        const effectiveAmount = isFlexible ? Math.min(numericAmount, remaining) : numericAmount;

        if (isFlexible && remaining <= 0) {
            return res.status(400).json({ success: false, message: 'This plan is already fully paid and ready for redemption' });
        }

        // Deduct from wallet
        user.walletBalance -= effectiveAmount;
        await user.save({ validateBeforeSave: false });

        const rate     = await getCurrentRateWithRefresh();
        const goldRate = getRateForPurity(rate, scheme.goldPurity) || 1;
        const goldWeight = Number((effectiveAmount / goldRate).toFixed(4));

        const nextTotalPaid = alreadyPaid + effectiveAmount;

        // For flexible: recalculate installment count from total paid
        let installmentNumber = scheme.paidInstallments + 1;
        if (isFlexible) {
            const installmentAmt = Number(scheme.planAmount || scheme.monthlyAmount || 1);
            installmentNumber = Math.min(scheme.totalInstallments, Math.ceil(nextTotalPaid / installmentAmt));
        }

        const payment = await Payment.create({
            user: targetUserId,
            scheme: scheme._id,
            amount: effectiveAmount,
            goldRateAtPayment: goldRate,
            goldWeightCredited: goldWeight,
            bonusGoldWeight: 0,
            totalGoldWeight: goldWeight,
            paymentMethod: 'DigiGold',
            status: 'completed',
            installmentNumber,
            totalAmount: effectiveAmount,
            completedAt: new Date(),
            collectionSource: 'customer',
            notes: 'Paid from Digi Gold wallet'
        });

        // Update scheme
        scheme.totalAmountPaid  = nextTotalPaid;
        scheme.totalGoldWeight += goldWeight;
        scheme.lastPaymentDate  = new Date();

        if (isFlexible) {
            const installmentAmt = Number(scheme.planAmount || scheme.monthlyAmount || 1);
            scheme.paidInstallments = Math.min(
                scheme.totalInstallments,
                Math.floor(nextTotalPaid / installmentAmt)
            );
            scheme.advanceAmount = Math.max(0, nextTotalPaid - (scheme.paidInstallments * installmentAmt));
            // No fixed nextDueDate for flexible plans
        } else {
            scheme.paidInstallments += 1;
            scheme.advanceAmount     = 0;
            scheme.nextDueDate       = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        scheme.installmentHistory.push({
            installmentNumber,
            amount: effectiveAmount,
            goldRate,
            goldWeight,
            paymentDate:   new Date(),
            paymentMethod: 'Cash',       // enum value
            paymentId:     payment._id,
            status:        'completed'
        });

        // Auto-mature when fully paid
        if (nextTotalPaid >= totalPlanAmount) {
            scheme.status = 'matured';
        }

        await scheme.save();

        await User.findByIdAndUpdate(targetUserId, {
            $inc: { totalGoldWeight: goldWeight, totalSavings: effectiveAmount }
        });

        await WalletTransaction.create({
            user: user._id,
            type: 'wallet_payment',
            amount: effectiveAmount,
            balanceAfter: { cash: user.walletBalance || 0, gold: user.walletGoldBalance || 0 },
            scheme: scheme._id,
            remarks: `Payment of Rs ${effectiveAmount} for ${scheme.schemeName} (${isFlexible ? 'flexible' : 'installment'})`,
            createdBy: req.user._id
        });

        res.status(200).json({
            success: true,
            message: `Rs ${effectiveAmount.toLocaleString('en-IN')} paid from Digi Gold wallet`,
            data: {
                amountPaid: effectiveAmount,
                goldCredited: goldWeight,
                goldRate,
                newWalletBalance: user.walletBalance,
                totalAmountPaid: nextTotalPaid,
                remainingAmount: Math.max(0, totalPlanAmount - nextTotalPaid),
                schemeStatus: scheme.status
            }
        });
    } catch (error) {
        next(error);
    }
};
