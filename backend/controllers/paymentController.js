const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const {
    getCurrentRateWithRefresh,
    getRateForPurity
} = require('../services/goldRateFetcher');

const calculateFlexibleProgress = (scheme, totalAmountPaid) => {
    const installmentAmount = Number(scheme.planAmount || scheme.monthlyAmount || 0);
    if (!installmentAmount) {
        return { paidInstallments: scheme.paidInstallments || 0, advanceAmount: 0 };
    }

    const paidInstallments = Math.min(
        Number(scheme.totalInstallments || 0),
        Math.floor(Number(totalAmountPaid || 0) / installmentAmount)
    );

    return {
        paidInstallments,
        advanceAmount: Math.max(0, Number(totalAmountPaid || 0) - (paidInstallments * installmentAmount))
    };
};

const getRazorpayClient = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_ID.includes('xxxxx')) {
        return null;
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createOrder = async (req, res, next) => {
    try {
        const { amount, schemeId } = req.body;

        if (!amount || amount < 100) {
            return res.status(400).json({
                success: false,
                message: 'Minimum payment amount is ₹100'
            });
        }

        // Verify scheme exists and belongs to user
        const scheme = await Scheme.findOne({
            _id: schemeId,
            user: req.user._id,
            status: 'active'
        });

        if (!scheme) {
            return res.status(404).json({
                success: false,
                message: 'Active scheme not found'
            });
        }

        const razorpay = getRazorpayClient();
        if (!razorpay) {
            return res.status(500).json({
                success: false,
                message: 'Razorpay is not configured for this environment'
            });
        }

        // Create Razorpay order
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${schemeId.slice(-6)}`,
            notes: {
                schemeId: schemeId,
                schemeName: scheme.schemeName,
                userId: req.user._id.toString(),
                customerName: req.user.name
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount / 100,
                currency: order.currency,
                receipt: order.receipt,
                key: process.env.RAZORPAY_KEY_ID
            }
        });

    } catch (error) {
        // Razorpay order creation error
        next(error);
    }
};

// @desc    Verify payment and update scheme
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            schemeId,
            amount
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing payment verification details'
            });
        }

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Invalid signature.'
            });
        }

        // Get scheme
        const scheme = await Scheme.findOne({
            _id: schemeId,
            user: req.user._id,
            status: 'active'
        });

        if (!scheme) {
            return res.status(404).json({
                success: false,
                message: 'Active scheme not found'
            });
        }

        // Get current gold rate
        const currentRate = await getCurrentRateWithRefresh();
        if (!currentRate) {
            return res.status(400).json({
                success: false,
                message: 'Gold rate not available'
            });
        }

        const goldRate = getRateForPurity(currentRate, scheme.goldPurity);

        // Calculate gold weight and bonus
        const goldWeight = parseFloat((amount / goldRate).toFixed(4));
        const bonusPercentage = scheme.calculateBonus();
        const bonusWeight = parseFloat((goldWeight * bonusPercentage / 100).toFixed(4));
        const totalGoldWeight = goldWeight + bonusWeight;

        // Create payment record
        const payment = await Payment.create({
            user: req.user._id,
            scheme: scheme._id,
            amount,
            goldRateAtPayment: goldRate,
            goldWeightCredited: goldWeight,
            bonusGoldWeight: bonusWeight,
            totalGoldWeight,
            paymentMethod: 'Razorpay',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'completed',
            completedAt: new Date(),
            installmentNumber: scheme.paidInstallments + 1,
            gstAmount: parseFloat((amount * 0.03).toFixed(2)),
            totalAmount: amount
        });

        // Update scheme
        scheme.paidInstallments += 1;
        scheme.totalAmountPaid += amount;
        scheme.totalGoldWeight += totalGoldWeight;
        scheme.bonusGoldWeight += bonusWeight;
        scheme.lastPaymentDate = new Date();
        scheme.nextDueDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));

        scheme.installmentHistory.push({
            installmentNumber: scheme.paidInstallments,
            amount,
            goldRate,
            goldWeight: totalGoldWeight,
            bonusWeight,
            paymentDate: new Date(),
            paymentMethod: 'Razorpay',
            transactionId: razorpay_payment_id,
            paymentId: payment._id,
            status: 'completed'
        });

        if (scheme.paidInstallments >= scheme.totalInstallments) {
            scheme.status = 'matured';
        }

        await scheme.save();

        // Update user totals
        await User.findByIdAndUpdate(req.user._id, {
            $inc: {
                totalGoldWeight: totalGoldWeight,
                totalSavings: amount
            }
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified and processed successfully! 🎉',
            data: {
                paymentId: payment.paymentId,
                invoiceNumber: payment.invoiceNumber,
                amount,
                goldRate,
                goldWeightAdded: goldWeight,
                bonusWeight,
                totalGoldWeightAdded: totalGoldWeight,
                installmentNumber: scheme.paidInstallments,
                schemeStatus: scheme.status,
                totalSchemeGoldWeight: scheme.totalGoldWeight
            }
        });

    } catch (error) {
        // Payment verification error
        next(error);
    }
};

// @desc    Get payment history for user
// @route   GET /api/payments
// @access  Private
exports.getPaymentHistory = async (req, res, next) => {
    try {
        const { schemeId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Build query
        let query = { user: req.user._id };

        if (schemeId) {
            query.scheme = schemeId;
        }

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const payments = await Payment.find(query)
            .populate('scheme', 'schemeName schemeId monthlyAmount')
            .populate('collectedBy', 'name role phone')
            .sort({ paymentDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        // Calculate totals
        const totals = await Payment.aggregate([
            { $match: { user: req.user._id, status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalGoldWeight: { $sum: '$totalGoldWeight' },
                    totalPayments: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: payments.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            summary: totals[0] || { totalAmount: 0, totalGoldWeight: 0, totalPayments: 0 },
            data: payments
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            user: req.user._id
        })
        .populate('scheme', 'schemeName schemeId monthlyAmount totalGoldWeight')
        .populate('user', 'name customerId phone email address')
        .populate('collectedBy', 'name role phone');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get payment receipt
// @route   GET /api/payments/:id/receipt
// @access  Private
exports.getReceipt = async (req, res, next) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'completed'
        })
        .populate('scheme', 'schemeName schemeId goldPurity benefits')
        .populate('user', 'name customerId phone email address')
        .populate('collectedBy', 'name role phone')
        .populate('branch', 'branchName branchCode address phone gstNumber');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment receipt not found'
            });
        }

        // Format receipt data
        const receipt = {
            receiptNumber: payment.invoiceNumber,
            paymentId: payment.paymentId,
            date: payment.paymentDate,
            customer: {
                name: payment.user.name,
                customerId: payment.user.customerId,
                phone: payment.user.phone,
                email: payment.user.email,
                address: payment.user.address
            },
            scheme: {
                name: payment.scheme.schemeName,
                schemeId: payment.scheme.schemeId,
                goldPurity: payment.scheme.goldPurity
            },
            payment: {
                amount: payment.amount,
                gst: payment.gstAmount,
                total: payment.totalAmount,
                method: payment.paymentMethod,
                transactionId: payment.razorpayPaymentId || payment.transactionId,
                collectedBy: payment.collectedBy ? {
                    name: payment.collectedBy.name,
                    role: payment.collectedBy.role,
                    phone: payment.collectedBy.phone
                } : null,
                billNumber: payment.billNumber || ''
            },
            gold: {
                rate: payment.goldRateAtPayment,
                weightCredited: payment.goldWeightCredited,
                bonusWeight: payment.bonusGoldWeight,
                totalWeight: payment.totalGoldWeight
            },
            installment: {
                number: payment.installmentNumber,
                status: payment.status
            }
        };

        res.status(200).json({
            success: true,
            data: receipt
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Download payment receipt as PDF (placeholder)
// @route   GET /api/payments/:id/download
// @access  Private
exports.downloadReceipt = async (req, res, next) => {
    try {
        // This would generate a PDF receipt
        // For now, return the receipt data
        const payment = await Payment.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'completed'
        }).populate('scheme user branch');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        // TODO: Implement PDF generation
        res.status(200).json({
            success: true,
            message: 'PDF generation not implemented yet',
            data: payment
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Create manual payment / collection
// @route   POST /api/payments
// @access  Private
exports.createManualPayment = async (req, res, next) => {
    try {
        const { scheme: schemeId, amount, paymentMethod, transactionId, notes, user: requestedUserId, billNumber } = req.body;
        const numericAmount = Number(amount || 0);

        if (!schemeId || numericAmount <= 0 || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Scheme, amount and payment method are required'
            });
        }

        const scheme = await Scheme.findById(schemeId);
        if (!scheme) {
            return res.status(404).json({ success: false, message: 'Scheme not found' });
        }

        const targetUserId = requestedUserId || scheme.user?.toString();
        const isPrivilegedCollector = ['admin', 'staff', 'agent'].includes(req.user.role);
        if (!isPrivilegedCollector && String(targetUserId) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (String(scheme.user) !== String(targetUserId)) {
            return res.status(400).json({ success: false, message: 'Scheme does not belong to the selected customer' });
        }

        if (scheme.status !== 'active') {
            return res.status(400).json({ success: false, message: 'Only active schemes can receive payments' });
        }

        const totalPlanAmount = Number((scheme.planAmount || scheme.monthlyAmount || 0) * (scheme.totalInstallments || 0));
        if (Number(scheme.totalAmountPaid || 0) >= totalPlanAmount) {
            return res.status(400).json({ success: false, message: 'This scheme is already fully paid and ready for redemption' });
        }

        if (scheme.schemeType !== 'flexible' && numericAmount !== Number(scheme.monthlyAmount)) {
            return res.status(400).json({
                success: false,
                message: `This plan accepts only the fixed installment amount of Rs ${Number(scheme.monthlyAmount).toLocaleString('en-IN')}`
            });
        }

        const currentRate = await getCurrentRateWithRefresh();
        if (!currentRate) {
            return res.status(400).json({ success: false, message: 'Gold rate not available' });
        }

        const goldRate = getRateForPurity(currentRate, scheme.goldPurity);
        const goldWeight = parseFloat((numericAmount / goldRate).toFixed(4));
        const bonusPercentage = typeof scheme.calculateBonus === 'function' ? scheme.calculateBonus() : 0;
        const bonusWeight = parseFloat((goldWeight * bonusPercentage / 100).toFixed(4));
        const totalGoldWeight = goldWeight + bonusWeight;
        const nextTotalAmountPaid = Number(scheme.totalAmountPaid || 0) + numericAmount;
        const flexibleProgress = calculateFlexibleProgress(scheme, nextTotalAmountPaid);

        const installmentNumber = scheme.schemeType === 'flexible'
            ? Math.min(scheme.totalInstallments, flexibleProgress.paidInstallments + (flexibleProgress.advanceAmount > 0 ? 1 : 0))
            : Number(scheme.paidInstallments || 0) + 1;

        const payment = await Payment.create({
            user: targetUserId,
            scheme: scheme._id,
            amount: numericAmount,
            goldRateAtPayment: goldRate,
            goldWeightCredited: goldWeight,
            bonusGoldWeight: bonusWeight,
            totalGoldWeight,
            paymentMethod,
            transactionId,
            status: 'completed',
            completedAt: new Date(),
            installmentNumber,
            gstAmount: parseFloat((numericAmount * 0.03).toFixed(2)),
            totalAmount: numericAmount,
            collectedBy: isPrivilegedCollector ? req.user._id : undefined,
            collectionSource: isPrivilegedCollector ? req.user.role : 'customer',
            notes: notes || (isPrivilegedCollector ? `Collected by ${req.user.role}` : ''),
            billNumber: billNumber || ''
        });

        scheme.totalAmountPaid = nextTotalAmountPaid;
        scheme.totalGoldWeight += totalGoldWeight;
        scheme.bonusGoldWeight += bonusWeight;
        scheme.lastPaymentDate = new Date();
        scheme.nextDueDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));

        if (scheme.schemeType === 'flexible') {
            scheme.paidInstallments = flexibleProgress.paidInstallments;
            scheme.advanceAmount = flexibleProgress.advanceAmount;
        } else {
            scheme.paidInstallments += 1;
            scheme.advanceAmount = 0;
        }

        scheme.installmentHistory.push({
            installmentNumber,
            amount: numericAmount,
            goldRate,
            goldWeight: totalGoldWeight,
            bonusWeight,
            paymentDate: new Date(),
            paymentMethod,
            transactionId,
            paymentId: payment._id,
            status: 'completed'
        });

        if (scheme.totalAmountPaid >= totalPlanAmount) {
            scheme.status = 'matured';
        }

        await scheme.save();

        await User.findByIdAndUpdate(targetUserId, {
            $inc: {
                totalGoldWeight: totalGoldWeight,
                totalSavings: numericAmount
            }
        });

        res.status(201).json({
            success: true,
            message: isPrivilegedCollector ? 'Collection recorded successfully' : 'Payment recorded successfully',
            data: payment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Compatibility endpoint for passbook-style grouped payments
// @route   GET /api/payments/user/self
// @access  Private
exports.getGroupedPaymentsForSelf = async (req, res, next) => {
    try {
        const payments = await Payment.find({
            user: req.user._id,
            status: 'completed'
        })
            .populate('scheme', 'schemeName schemeId')
            .sort({ paymentDate: -1 });

        const groupedMap = new Map();

        payments.forEach((payment) => {
            const schemeKey = payment.scheme?._id?.toString() || 'unknown';
            if (!groupedMap.has(schemeKey)) {
                groupedMap.set(schemeKey, {
                    plan_name: payment.scheme?.schemeName || 'Scheme',
                    scheme_id: payment.scheme?.schemeId || '',
                    payments: []
                });
            }

            groupedMap.get(schemeKey).payments.push({
                id: payment._id,
                payment_id: payment.paymentId,
                amount: payment.amount,
                gold_weight: payment.totalGoldWeight,
                installment_number: payment.installmentNumber,
                payment_method: payment.paymentMethod,
                payment_date: payment.paymentDate,
                invoice_number: payment.invoiceNumber,
                bill_number: payment.billNumber || '',
                collection_source: payment.collectionSource || 'customer'
            });
        });

        res.status(200).json({
            success: true,
            plans: Array.from(groupedMap.values())
        });
    } catch (error) {
        next(error);
    }
};
