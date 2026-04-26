const Scheme = require('../models/Scheme');
const User = require('../models/User');
const GoldRate = require('../models/GoldRate');
const Payment = require('../models/Payment');
const PlanCatalog = require('../models/PlanCatalog');

// Scheme plans configuration
const SCHEME_PLANS = [
    {
        name: 'SuperGold',
        type: 'monthly',
        minAmount: 1000,
        maxAmount: 100000,
        tenure: '11 months',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 75,
            wastageDiscount: 75,
            diamondDiscount: 60
        },
        description: 'Our most popular scheme! Save monthly and get 75% off on making charges.',
        features: ['Flexible amount from ₹1,000', 'Gold rate locked on payment day', 'Bonus up to 1.25%', 'Free insurance'],
        popular: true
    },
    {
        name: 'DigiGold',
        type: 'flexible',
        minAmount: 100,
        maxAmount: 50000,
        tenure: '330 days',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 50,
            wastageDiscount: 50,
            diamondDiscount: 40
        },
        description: 'Start your gold savings journey with just ₹100. Save anytime, any amount.',
        features: ['No fixed installments', 'Start from ₹100', 'Tiered bonus system', 'Digital gold accumulation'],
        popular: false
    },
    {
        name: 'FlexiGold',
        type: 'flexible',
        minAmount: 500,
        maxAmount: 75000,
        tenure: '1 year',
        totalInstallments: 12,
        benefits: {
            makingChargeDiscount: 60,
            wastageDiscount: 60,
            diamondDiscount: 50
        },
        description: 'Maximum flexibility with excellent benefits. Pay weekly or monthly.',
        features: ['Weekly/Monthly options', 'Auto-debit available', 'Transfer between schemes', 'Family sharing'],
        popular: false
    },
    {
        name: 'DiamondSaver',
        type: 'monthly',
        minAmount: 2000,
        maxAmount: 200000,
        tenure: '11 months',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 50,
            wastageDiscount: 50,
            diamondDiscount: 75
        },
        description: 'Special scheme for diamond jewellery lovers. Get 75% off on diamond jewellery.',
        features: ['Best for diamond purchases', 'Priority access to collections', 'Special diamond discount', 'VIP customer service'],
        popular: false
    },
    {
        name: 'PremiumGold',
        type: 'monthly',
        minAmount: 5000,
        maxAmount: 500000,
        tenure: '11 months',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 100,
            wastageDiscount: 100,
            diamondDiscount: 75,
            extraBonusPercentage: 2
        },
        description: 'Premium scheme for high-value customers. 100% off on making charges!',
        features: ['Zero making charges', 'Extra 2% bonus', 'Dedicated relationship manager', 'Home delivery', 'Exclusive designs'],
        popular: false
    }
];

// @desc    Get all scheme plans
// @route   GET /api/schemes/plans
// @access  Public
exports.getSchemePlans = async (req, res, next) => {
    try {
        const catalogPlans = await PlanCatalog.find({ active: true }).sort({ priority: 1, createdAt: -1 });
        const plans = catalogPlans.length
            ? catalogPlans.map((plan) => ({
                id: plan._id,
                name: plan.name,
                type: plan.schemeType,
                plan_type: plan.planType,
                jewellery_type: plan.jewelleryType,
                minAmount: plan.minAmount,
                maxAmount: plan.maxAmount,
                tenure: plan.tenure,
                totalInstallments: plan.totalInstallments,
                benefits: plan.benefits,
                description: plan.description,
                features: plan.features,
                popular: plan.popular,
                imageUrl: plan.imageUrl,
                active: plan.active
            }))
            : SCHEME_PLANS;

        res.status(200).json({
            success: true,
            count: plans.length,
            data: plans
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new scheme enrollment
// @route   POST /api/schemes
// @access  Private
exports.createScheme = async (req, res, next) => {
    try {
        const { schemeName, monthlyAmount, goldPurity, autoDebit, notes, branch, planId } = req.body;

        // Validate scheme name
        let plan = SCHEME_PLANS.find(p => p.name === schemeName);
        if (!plan && planId) {
            const catalogPlan = await PlanCatalog.findById(planId);
            if (catalogPlan?.active) {
                plan = {
                    name: catalogPlan.name,
                    type: catalogPlan.schemeType,
                    minAmount: catalogPlan.minAmount,
                    maxAmount: catalogPlan.maxAmount || catalogPlan.minAmount,
                    totalInstallments: catalogPlan.totalInstallments,
                    benefits: catalogPlan.benefits || {},
                    description: catalogPlan.description,
                    features: catalogPlan.features || []
                };
            }
        }

        if (!plan && schemeName) {
            const catalogPlan = await PlanCatalog.findOne({ name: schemeName, active: true });
            if (catalogPlan) {
                plan = {
                    name: catalogPlan.name,
                    type: catalogPlan.schemeType,
                    minAmount: catalogPlan.minAmount,
                    maxAmount: catalogPlan.maxAmount || catalogPlan.minAmount,
                    totalInstallments: catalogPlan.totalInstallments,
                    benefits: catalogPlan.benefits || {},
                    description: catalogPlan.description,
                    features: catalogPlan.features || []
                };
            }
        }

        if (!plan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid scheme name'
            });
        }

        // Validate amount
        if (monthlyAmount < plan.minAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum amount for ${schemeName} is ₹${plan.minAmount}`
            });
        }

        if (monthlyAmount > plan.maxAmount) {
            return res.status(400).json({
                success: false,
                message: `Maximum amount for ${schemeName} is ₹${plan.maxAmount}`
            });
        }

        // Check active schemes limit (max 5)
        const activeSchemes = await Scheme.countDocuments({
            user: req.user._id,
            status: 'active'
        });

        if (activeSchemes >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 5 active schemes allowed per user'
            });
        }

        // Get current gold rate
        const currentRate = await GoldRate.getCurrentRate();
        if (!currentRate) {
            return res.status(400).json({
                success: false,
                message: 'Gold rate not available. Please try again later.'
            });
        }

        // Determine gold rate based on purity
        const purity = goldPurity || '22K';
        let goldRate;
        switch (purity) {
            case '24K':
                goldRate = currentRate.gold24K;
                break;
            case '18K':
                goldRate = currentRate.gold18K;
                break;
            default:
                goldRate = currentRate.gold22K;
        }

        // Calculate gold weight for first installment
        const goldWeight = parseFloat((monthlyAmount / goldRate).toFixed(4));

        // Create scheme
        const scheme = await Scheme.create({
            user: req.user._id,
            schemeName: plan.name,
            schemeType: plan.type,
            monthlyAmount,
            totalInstallments: plan.totalInstallments,
            goldPurity: purity,
            totalAmountPaid: monthlyAmount,
            totalGoldWeight: goldWeight,
            paidInstallments: 1,
            lastPaymentDate: new Date(),
            benefits: plan.benefits,
            autoDebit: autoDebit || { enabled: false },
            notes,
            branch,
            installmentHistory: [{
                installmentNumber: 1,
                amount: monthlyAmount,
                goldRate: goldRate,
                goldWeight: goldWeight,
                bonusWeight: 0,
                paymentDate: new Date(),
                paymentMethod: 'Initial',
                status: 'completed'
            }]
        });

        // Update user's total gold weight and savings
        await User.findByIdAndUpdate(req.user._id, {
            $inc: {
                totalGoldWeight: goldWeight,
                totalSavings: monthlyAmount
            }
        });

        // Populate and return
        const populatedScheme = await Scheme.findById(scheme._id)
            .populate('user', 'name customerId phone')
            .populate('branch', 'branchName branchCode');

        res.status(201).json({
            success: true,
            message: 'Scheme enrolled successfully! 🎉',
            data: populatedScheme
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all schemes for logged in user
// @route   GET /api/schemes
// @access  Private
exports.getUserSchemes = async (req, res, next) => {
    try {
        const { status, schemeName, sort } = req.query;

        // Build query
        let query = { user: req.user._id };

        if (status) {
            query.status = status;
        }

        if (schemeName) {
            query.schemeName = schemeName;
        }

        // Sort options
        let sortOption = { createdAt: -1 };
        if (sort === 'amount') {
            sortOption = { monthlyAmount: -1 };
        } else if (sort === 'maturity') {
            sortOption = { maturityDate: 1 };
        } else if (sort === 'gold') {
            sortOption = { totalGoldWeight: -1 };
        }

        const schemes = await Scheme.find(query)
            .populate('branch', 'branchName branchCode')
            .sort(sortOption);

        // Get current gold rate for value calculation
        const currentRate = await GoldRate.getCurrentRate();

        // Add calculated fields
        const schemesWithDetails = schemes.map(scheme => {
            const schemeObj = scheme.toObject();
            
            // Current value based on gold rate
            let rateForPurity = currentRate?.gold22K || 0;
            if (scheme.goldPurity === '24K') rateForPurity = currentRate?.gold24K || 0;
            if (scheme.goldPurity === '18K') rateForPurity = currentRate?.gold18K || 0;
            
            schemeObj.currentValue = parseFloat((scheme.totalGoldWeight * rateForPurity).toFixed(2));
            schemeObj.profit = parseFloat((schemeObj.currentValue - scheme.totalAmountPaid).toFixed(2));
            schemeObj.profitPercentage = scheme.totalAmountPaid > 0 
                ? parseFloat(((schemeObj.profit / scheme.totalAmountPaid) * 100).toFixed(2))
                : 0;
            schemeObj.currentGoldRate = rateForPurity;

            return schemeObj;
        });

        res.status(200).json({
            success: true,
            count: schemes.length,
            data: schemesWithDetails
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get single scheme details
// @route   GET /api/schemes/:id
// @access  Private
exports.getSchemeById = async (req, res, next) => {
    try {
        const scheme = await Scheme.findOne({
            _id: req.params.id,
            user: req.user._id
        })
        .populate('user', 'name customerId phone email')
        .populate('branch', 'branchName branchCode address phone')
        .populate('installmentHistory.paymentId', 'paymentId invoiceNumber');

        if (!scheme) {
            return res.status(404).json({
                success: false,
                message: 'Scheme not found'
            });
        }

        // Get current gold rate
        const currentRate = await GoldRate.getCurrentRate();

        let rateForPurity = currentRate?.gold22K || 0;
        if (scheme.goldPurity === '24K') rateForPurity = currentRate?.gold24K || 0;
        if (scheme.goldPurity === '18K') rateForPurity = currentRate?.gold18K || 0;

        const schemeObj = scheme.toObject();
        schemeObj.currentGoldRate = rateForPurity;
        schemeObj.currentValue = parseFloat((scheme.totalGoldWeight * rateForPurity).toFixed(2));
        schemeObj.profit = parseFloat((schemeObj.currentValue - scheme.totalAmountPaid).toFixed(2));
        schemeObj.profitPercentage = scheme.totalAmountPaid > 0
            ? parseFloat(((schemeObj.profit / scheme.totalAmountPaid) * 100).toFixed(2))
            : 0;
        schemeObj.isOverdue = scheme.isOverdue();
        schemeObj.daysOverdue = scheme.getDaysOverdue();

        // Get payment history
        const payments = await Payment.find({ scheme: scheme._id })
            .select('paymentId amount goldWeightCredited totalGoldWeight paymentMethod status paymentDate invoiceNumber')
            .sort({ paymentDate: -1 });

        schemeObj.payments = payments;

        res.status(200).json({
            success: true,
            data: schemeObj
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Pay installment
// @route   POST /api/schemes/:id/pay
// @access  Private
exports.payInstallment = async (req, res, next) => {
    try {
        const { amount, paymentMethod, transactionId } = req.body;

        // Validate
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid amount'
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Please provide payment method'
            });
        }

        // Get scheme
        const scheme = await Scheme.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'active'
        });

        if (!scheme) {
            return res.status(404).json({
                success: false,
                message: 'Active scheme not found'
            });
        }

        // Check if already fully paid
        if (scheme.paidInstallments >= scheme.totalInstallments) {
            return res.status(400).json({
                success: false,
                message: 'All installments already paid. Scheme is ready for redemption.'
            });
        }

        // Get current gold rate
        const currentRate = await GoldRate.getCurrentRate();
        if (!currentRate) {
            return res.status(400).json({
                success: false,
                message: 'Gold rate not available. Please try again later.'
            });
        }

        let goldRate = currentRate.gold22K;
        if (scheme.goldPurity === '24K') goldRate = currentRate.gold24K;
        if (scheme.goldPurity === '18K') goldRate = currentRate.gold18K;

        // Calculate gold weight
        const goldWeight = parseFloat((amount / goldRate).toFixed(4));

        // Calculate bonus
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
            paymentMethod,
            transactionId,
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

        // Update next due date
        scheme.nextDueDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000));

        // Add to installment history
        scheme.installmentHistory.push({
            installmentNumber: scheme.paidInstallments,
            amount,
            goldRate,
            goldWeight: totalGoldWeight,
            bonusWeight,
            paymentDate: new Date(),
            paymentMethod,
            transactionId,
            paymentId: payment._id,
            status: 'completed'
        });

        // Check if matured
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
            message: 'Payment successful! 🎉',
            data: {
                paymentId: payment.paymentId,
                invoiceNumber: payment.invoiceNumber,
                amount,
                goldRate,
                goldWeightAdded: goldWeight,
                bonusWeight,
                totalGoldWeightAdded: totalGoldWeight,
                installmentNumber: scheme.paidInstallments,
                totalInstallments: scheme.totalInstallments,
                schemeStatus: scheme.status,
                totalGoldWeight: scheme.totalGoldWeight,
                nextDueDate: scheme.nextDueDate
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get scheme summary/statistics
// @route   GET /api/schemes/summary
// @access  Private
exports.getSchemeSummary = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Get all schemes for user
        const schemes = await Scheme.find({ user: userId });

        // Get current gold rate
        const currentRate = await GoldRate.getCurrentRate();

        // Calculate summary
        const summary = {
            totalSchemes: schemes.length,
            activeSchemes: schemes.filter(s => s.status === 'active').length,
            maturedSchemes: schemes.filter(s => s.status === 'matured').length,
            redeemedSchemes: schemes.filter(s => s.status === 'redeemed').length,
            totalGoldWeight: 0,
            totalAmountInvested: 0,
            totalBonusGold: 0,
            currentValue: 0,
            profit: 0,
            profitPercentage: 0,
            schemeBreakdown: []
        };

        schemes.forEach(scheme => {
            summary.totalGoldWeight += scheme.totalGoldWeight;
            summary.totalAmountInvested += scheme.totalAmountPaid;
            summary.totalBonusGold += scheme.bonusGoldWeight;

            let rate = currentRate?.gold22K || 0;
            if (scheme.goldPurity === '24K') rate = currentRate?.gold24K || 0;
            if (scheme.goldPurity === '18K') rate = currentRate?.gold18K || 0;

            const value = scheme.totalGoldWeight * rate;
            summary.currentValue += value;

            summary.schemeBreakdown.push({
                schemeId: scheme.schemeId,
                schemeName: scheme.schemeName,
                status: scheme.status,
                goldWeight: scheme.totalGoldWeight,
                amountPaid: scheme.totalAmountPaid,
                currentValue: parseFloat(value.toFixed(2)),
                progress: scheme.progress
            });
        });

        summary.totalGoldWeight = parseFloat(summary.totalGoldWeight.toFixed(4));
        summary.currentValue = parseFloat(summary.currentValue.toFixed(2));
        summary.profit = parseFloat((summary.currentValue - summary.totalAmountInvested).toFixed(2));
        summary.profitPercentage = summary.totalAmountInvested > 0
            ? parseFloat(((summary.profit / summary.totalAmountInvested) * 100).toFixed(2))
            : 0;

        res.status(200).json({
            success: true,
            data: summary
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Cancel scheme (only if less than 3 installments paid)
// @route   PUT /api/schemes/:id/cancel
// @access  Private
exports.cancelScheme = async (req, res, next) => {
    try {
        const { reason } = req.body;

        const scheme = await Scheme.findOne({
            _id: req.params.id,
            user: req.user._id,
            status: 'active'
        });

        if (!scheme) {
            return res.status(404).json({
                success: false,
                message: 'Active scheme not found'
            });
        }

        // Can only cancel if less than 3 installments paid
        if (scheme.paidInstallments >= 3) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel scheme after 3 installments. Please contact customer support.'
            });
        }

        scheme.status = 'cancelled';
        scheme.notes = `Cancelled: ${reason || 'User requested cancellation'}`;
        await scheme.save();

        res.status(200).json({
            success: true,
            message: 'Scheme cancelled successfully',
            data: scheme
        });

    } catch (error) {
        next(error);
    }
};
