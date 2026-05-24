const User = require('../models/User');
const Scheme = require('../models/Scheme');
const Payment = require('../models/Payment');
const GoldRate = require('../models/GoldRate');
const Redemption = require('../models/Redemption');
const Branch = require('../models/Branch');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
    try {
        // Get counts
        const totalUsers = await User.countDocuments({ role: 'customer' });
        const totalSchemes = await Scheme.countDocuments();
        const activeSchemes = await Scheme.countDocuments({ status: 'active' });
        const maturedSchemes = await Scheme.countDocuments({ status: 'matured' });

        // Get financial stats
        const paymentStats = await Payment.aggregate([
            { $match: { status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: '$amount' },
                    totalPayments: { $sum: 1 },
                    totalGoldWeight: { $sum: '$totalGoldWeight' }
                }
            }
        ]);

        // Monthly revenue (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const monthlyRevenue = await Payment.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    paymentDate: { $gte: twelveMonthsAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentDate' },
                        month: { $month: '$paymentDate' }
                    },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    goldWeight: { $sum: '$totalGoldWeight' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        // Scheme distribution
        const schemeDistribution = await Scheme.aggregate([
            {
                $group: {
                    _id: '$schemeName',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmountPaid' },
                    totalGold: { $sum: '$totalGoldWeight' }
                }
            }
        ]);

        // Recent activities
        const recentPayments = await Payment.find({ status: 'completed' })
            .populate('user', 'name customerId')
            .populate('scheme', 'schemeName')
            .sort({ createdAt: -1 })
            .limit(10);

        const recentRegistrations = await User.find({ role: 'customer' })
            .select('name customerId phone createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        // Pending redemptions
        const pendingRedemptions = await Redemption.countDocuments({ status: 'requested' });

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayStats = await Payment.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    paymentDate: { $gte: today }
                } 
            },
            {
                $group: {
                    _id: null,
                    collection: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalSchemes,
                    activeSchemes,
                    maturedSchemes,
                    pendingRedemptions,
                    totalCollection: paymentStats[0]?.totalCollection || 0,
                    totalGoldWeight: paymentStats[0]?.totalGoldWeight || 0,
                    totalPayments: paymentStats[0]?.totalPayments || 0
                },
                today: {
                    collection: todayStats[0]?.collection || 0,
                    transactions: todayStats[0]?.count || 0
                },
                monthlyRevenue,
                schemeDistribution,
                recentPayments,
                recentRegistrations
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update gold rate
// @route   POST /api/admin/gold-rate
// @access  Private/Admin
exports.updateGoldRate = async (req, res, next) => {
    try {
        const { gold24K, silver, platinum, notes } = req.body;

        // Validate required fields
        if (!gold24K || !silver) {
            return res.status(400).json({
                success: false,
                message: 'Please provide 24K gold rate and silver rate'
            });
        }

        const rate24K = Number(gold24K);
        
        // Auto-calculate 22K and 18K from 24K
        const gold22K = Math.round(rate24K * (22 / 24) * 100) / 100;
        const gold18K = Math.round(rate24K * (18 / 24) * 100) / 100;

        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if rate exists for today
        let goldRate = await GoldRate.findOne({
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (goldRate) {
            // Update existing
            goldRate.gold22K = gold22K;
            goldRate.gold24K = rate24K;
            goldRate.gold18K = gold18K;
            goldRate.silver = silver;
            goldRate.platinum = platinum || 0;
            goldRate.notes = notes;
            goldRate.updatedBy = req.user._id;
            await goldRate.save();
        } else {
            // Create new
            goldRate = await GoldRate.create({
                date: today,
                gold22K,
                gold24K: rate24K,
                gold18K,
                silver,
                platinum: platinum || 0,
                notes,
                updatedBy: req.user._id
            });
        }

        res.status(200).json({
            success: true,
            message: 'Gold rate updated successfully',
            data: goldRate
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const { 
            search, 
            role, 
            isVerified, 
            isActive,
            page = 1, 
            limit = 20,
            sort = '-createdAt'
        } = req.query;

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { customerId: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) query.role = role;
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .select('-password -otp -otpExpiry')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: users
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get user by ID (admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -otp -otpExpiry')
            .populate('preferredBranch', 'branchName branchCode')
            .populate('referredBy', 'name customerId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's schemes
        const schemes = await Scheme.find({ user: user._id })
            .select('schemeId schemeName status totalGoldWeight totalAmountPaid');

        // Get recent payments
        const recentPayments = await Payment.find({ user: user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            data: {
                user,
                schemes,
                recentPayments
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update user (admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const { isActive, isVerified, role, notes } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (isActive !== undefined) user.isActive = isActive;
        if (isVerified !== undefined) user.isVerified = isVerified;
        if (role) user.role = role;
        if (notes) user.notes = notes;

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Admin users cannot be deleted'
            });
        }

        const [schemeCount, paymentCount] = await Promise.all([
            Scheme.countDocuments({ user: user._id }),
            Payment.countDocuments({ user: user._id })
        ]);

        if (schemeCount > 0 || paymentCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'User has linked schemes or payments. Mark the user inactive instead.'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all schemes (admin)
// @route   GET /api/admin/schemes
// @access  Private/Admin
exports.getAllSchemes = async (req, res, next) => {
    try {
        const { 
            status, 
            schemeName, 
            search,
            page = 1, 
            limit = 20 
        } = req.query;

        let query = {};

        if (status) query.status = status;
        if (schemeName) query.schemeName = schemeName;

        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { customerId: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            
            query.$or = [
                { schemeId: { $regex: search, $options: 'i' } },
                { user: { $in: users.map(u => u._id) } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const schemes = await Scheme.find(query)
            .populate('user', 'name phone customerId')
            .populate('branch', 'branchName branchCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Scheme.countDocuments(query);

        res.status(200).json({
            success: true,
            count: schemes.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            data: schemes
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update scheme (admin)
// @route   PUT /api/admin/schemes/:id
// @access  Private/Admin
exports.updateScheme = async (req, res, next) => {
    try {
        const { status, notes } = req.body;

        const scheme = await Scheme.findById(req.params.id);

        if (!scheme) {
            return res.status(404).json({
                success: false,
                message: 'Scheme not found'
            });
        }

        if (status) scheme.status = status;
        if (notes !== undefined) scheme.notes = notes;

        await scheme.save();

        res.status(200).json({
            success: true,
            message: 'Scheme updated successfully',
            data: scheme
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all payments (admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
    try {
        const { 
            status, 
            startDate, 
            endDate,
            page = 1, 
            limit = 20 
        } = req.query;

        let query = {};

        if (status) query.status = status;
        
        if (startDate || endDate) {
            query.paymentDate = {};
            if (startDate) query.paymentDate.$gte = new Date(startDate);
            if (endDate) query.paymentDate.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const payments = await Payment.find(query)
            .populate('user', 'name phone customerId')
            .populate('scheme', 'schemeName schemeId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        // Get totals for the query
        const totals = await Payment.aggregate([
            { $match: { ...query, status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalGold: { $sum: '$totalGoldWeight' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: payments.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            totals: totals[0] || { totalAmount: 0, totalGold: 0 },
            data: payments
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update payment (admin)
// @route   PUT /api/admin/payments/:id
// @access  Private/Admin
exports.updatePayment = async (req, res, next) => {
    try {
        const { status, paymentMethod, notes } = req.body;

        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (status) {
            payment.status = status;
            if (status === 'completed' && !payment.completedAt) payment.completedAt = new Date();
            if (status === 'failed') payment.failedAt = new Date();
        }

        if (paymentMethod) payment.paymentMethod = paymentMethod;
        if (notes !== undefined) payment.notes = notes;

        await payment.save();

        res.status(200).json({
            success: true,
            message: 'Payment updated successfully',
            data: payment
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Delete payment (admin)
// @route   DELETE /api/admin/payments/:id
// @access  Private/Admin
exports.deletePayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (payment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Completed payments cannot be deleted. Update the status instead.'
            });
        }

        await payment.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Payment deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all redemptions (admin)
// @route   GET /api/admin/redemptions
// @access  Private/Admin
exports.getAllRedemptions = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        let query = {};
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const redemptions = await Redemption.find(query)
            .populate('user', 'name phone customerId')
            .populate('scheme', 'schemeName schemeId')
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

// @desc    Approve redemption
// @route   PUT /api/admin/redemptions/:id/approve
// @access  Private/Admin
exports.approveRedemption = async (req, res, next) => {
    try {
        const { remarks } = req.body;

        const redemption = await Redemption.findById(req.params.id);

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found'
            });
        }

        if (redemption.status !== 'requested') {
            return res.status(400).json({
                success: false,
                message: 'Redemption cannot be approved in current status'
            });
        }

        redemption.status = 'approved';
        redemption.approvalDate = new Date();
        redemption.approvedBy = req.user._id;
        redemption.remarks = remarks;

        // Generate delivery OTP
        const otp = redemption.generateDeliveryOTP();
        await redemption.save();

        // Update scheme
        await Scheme.findByIdAndUpdate(redemption.scheme, {
            status: 'redeemed',
            'redemptionDetails.isRedeemed': true,
            'redemptionDetails.redeemedDate': new Date(),
            'redemptionDetails.redemptionId': redemption._id
        });

        res.status(200).json({
            success: true,
            message: 'Redemption approved successfully',
            data: redemption
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Reject redemption
// @route   PUT /api/admin/redemptions/:id/reject
// @access  Private/Admin
exports.rejectRedemption = async (req, res, next) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide rejection reason'
            });
        }

        const redemption = await Redemption.findById(req.params.id);

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found'
            });
        }

        redemption.status = 'rejected';
        redemption.cancellationReason = reason;
        redemption.cancelledDate = new Date();
        redemption.cancelledBy = req.user._id;
        await redemption.save();

        res.status(200).json({
            success: true,
            message: 'Redemption rejected',
            data: redemption
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Mark redemption as delivered
// @route   PUT /api/admin/redemptions/:id/deliver
// @access  Private/Admin
exports.markDelivered = async (req, res, next) => {
    try {
        const { otp } = req.body;

        const redemption = await Redemption.findById(req.params.id);

        if (!redemption) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found'
            });
        }

        if (redemption.status !== 'ready' && redemption.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Redemption is not ready for delivery'
            });
        }

        // Verify OTP
        if (redemption.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (new Date() > redemption.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        redemption.status = 'delivered';
        redemption.deliveryDate = new Date();
        redemption.deliveredBy = req.user._id;
        redemption.otpVerified = true;
        await redemption.save();

        // Update user's gold weight
        await User.findByIdAndUpdate(redemption.user, {
            $inc: { totalGoldWeight: -redemption.goldWeightUsed }
        });

        res.status(200).json({
            success: true,
            message: 'Redemption marked as delivered',
            data: redemption
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Create branch
// @route   POST /api/admin/branches
// @access  Private/Admin
exports.createBranch = async (req, res, next) => {
    try {
        const branch = await Branch.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            data: branch
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all branches
// @route   GET /api/admin/branches
// @access  Private/Admin
exports.getAllBranches = async (req, res, next) => {
    try {
        const { city, isActive } = req.query;

        let query = {};
        if (city) query['address.city'] = { $regex: city, $options: 'i' };
        if (isActive !== undefined) query.isActive = isActive === 'true';

        const branches = await Branch.find(query).sort({ branchName: 1 });

        res.status(200).json({
            success: true,
            count: branches.length,
            data: branches
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get operational insights for dashboard screens
// @route   GET /api/admin/operational-insights
// @access  Private/Admin
exports.getOperationalInsights = async (req, res, next) => {
    try {
        const [branchPerformance, topCustomers, overdueSchemes] = await Promise.all([
            Payment.aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: '$branch',
                        totalCollection: { $sum: '$amount' },
                        totalGoldWeight: { $sum: '$totalGoldWeight' },
                        paymentsCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'branches',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'branch'
                    }
                },
                { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
                { $sort: { totalCollection: -1 } }
            ]),
            User.find({ role: 'customer' })
                .select('name customerId totalSavings totalGoldWeight phone preferredBranch')
                .sort({ totalSavings: -1 })
                .limit(10)
                .populate('preferredBranch', 'branchName branchCode'),
            Scheme.find({ status: 'active', nextDueDate: { $lt: new Date() } })
                .populate('user', 'name customerId phone')
                .populate('branch', 'branchName branchCode')
                .sort({ nextDueDate: 1 })
                .limit(20)
        ]);

        res.status(200).json({
            success: true,
            data: {
                branchPerformance,
                topCustomers,
                overdueSchemes
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get collection summary split by collector/source
// @route   GET /api/admin/collection-summary
// @access  Private/Admin
exports.getCollectionSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const match = { status: 'completed' };

        if (startDate || endDate) {
            match.paymentDate = {};
            if (startDate) match.paymentDate.$gte = new Date(startDate);
            if (endDate) match.paymentDate.$lte = new Date(endDate);
        }

        const [bySource, byCollector, unassigned] = await Promise.all([
            Payment.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$collectionSource',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } }
            ]),
            Payment.aggregate([
                { $match: match },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'collectedBy',
                        foreignField: '_id',
                        as: 'collector'
                    }
                },
                { $unwind: { path: '$collector', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$collector._id',
                        collectorName: { $first: '$collector.name' },
                        collectorRole: { $first: '$collector.role' },
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { totalAmount: -1 } }
            ]),
            Payment.countDocuments({
                ...match,
                $or: [{ collectedBy: { $exists: false } }, { collectedBy: null }]
            })
        ]);

        res.status(200).json({
            success: true,
            data: {
                bySource,
                byCollector,
                customerSelfPayments: unassigned
            }
        });
    } catch (error) {
        next(error);
    }
};
