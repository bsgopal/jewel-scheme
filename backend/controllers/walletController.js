const User = require('../models/User');
const GoldRate = require('../models/GoldRate');
const Scheme = require('../models/Scheme');
const Payment = require('../models/Payment');
const WalletTransaction = require('../models/WalletTransaction');

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

        const rate = await GoldRate.getCurrentRate();
        const goldRate = rate?.gold22K;
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

        const user = await ensureWallet(targetUserId);
        if ((user.walletBalance || 0) < numericAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }

        const scheme = await Scheme.findOne({ _id: schemeId, user: targetUserId });
        if (!scheme) {
            return res.status(404).json({ success: false, message: 'Scheme not found' });
        }

        user.walletBalance -= numericAmount;
        await user.save({ validateBeforeSave: false });

        const rate = await GoldRate.getCurrentRate();
        const goldRate = rate?.gold22K || 1;
        const goldWeight = Number((numericAmount / goldRate).toFixed(4));
        const payment = await Payment.create({
            user: targetUserId,
            scheme: scheme._id,
            amount: numericAmount,
            goldRateAtPayment: goldRate,
            goldWeightCredited: goldWeight,
            bonusGoldWeight: 0,
            totalGoldWeight: goldWeight,
            paymentMethod: 'Cash',
            status: 'completed',
            installmentNumber: scheme.paidInstallments + 1,
            totalAmount: numericAmount,
            completedAt: new Date()
        });

        scheme.paidInstallments += 1;
        scheme.totalAmountPaid += numericAmount;
        scheme.totalGoldWeight += goldWeight;
        scheme.lastPaymentDate = new Date();
        scheme.nextDueDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));
        scheme.installmentHistory.push({
            installmentNumber: scheme.paidInstallments,
            amount: numericAmount,
            goldRate,
            goldWeight,
            paymentDate: new Date(),
            paymentMethod: 'Cash',
            paymentId: payment._id,
            status: 'completed'
        });
        await scheme.save();

        await WalletTransaction.create({
            user: user._id,
            type: 'wallet_payment',
            amount: numericAmount,
            balanceAfter: {
                cash: user.walletBalance || 0,
                gold: user.walletGoldBalance || 0
            },
            scheme: scheme._id,
            remarks: `Installment paid for ${scheme.schemeName}`,
            createdBy: req.user._id
        });

        res.status(200).json({ success: true, message: 'Installment paid from wallet', data: payment });
    } catch (error) {
        next(error);
    }
};
