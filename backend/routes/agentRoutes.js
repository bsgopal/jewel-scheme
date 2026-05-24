const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const AgentAssignment = require('../models/AgentAssignment');
const Payment = require('../models/Payment');

// ✅ ALL named routes BEFORE any /:id wildcard

// GET /api/agent/dashboard

router.get('/dashboard', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        // Get assigned customer IDs from AgentAssignment model
        let customerIds = [];
        if (req.user.role === 'agent') {
            const assignments = await AgentAssignment.find({
                agent: req.user._id,
                active: true
            }).select('customer');
            customerIds = assignments.map(a => a.customer);
        } else {
            // Admin sees all customers
            customerIds = await User.distinct('_id', { role: 'customer' });
        }

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        const [pendingInstallmentsCount, todaySchemes] = await Promise.all([
            Scheme.countDocuments({
                status: 'active',
                user: { $in: customerIds },
                nextDueDate: { $lt: new Date() }
            }),
            Scheme.find({
                status: 'active',
                user: { $in: customerIds },
                nextDueDate: { $gte: today, $lte: todayEnd }
            }).select('monthlyAmount')
        ]);

        const todayCollectionAmount = todaySchemes.reduce(
            (sum, s) => sum + (s.monthlyAmount || 0), 0
        );
        const commissionRate = req.user.agentProfile?.commissionRate || 0;
        const totalCommission = (todayCollectionAmount * commissionRate) / 100;

        res.json({
            success: true,
            data: {
                totalCustomers: customerIds.length,   // ✅ now correct
                pendingInstallmentsCount,
                todayCollectionAmount,
                totalCommission
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/agent/pending-installments?date=today
router.get('/pending-installments', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const { date } = req.query;

        let dateFilter = {};
        if (date === 'today') {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);
            dateFilter = { nextDueDate: { $gte: start, $lte: end } };
        } else if (date) {
            const d = new Date(date);
            const start = new Date(d); start.setHours(0, 0, 0, 0);
            const end = new Date(d); end.setHours(23, 59, 59, 999);
            dateFilter = { nextDueDate: { $gte: start, $lte: end } };
        }

        // ✅ Use AgentAssignment — same as agentManageController
        let userFilter = {};
        if (req.user.role === 'agent') {
            const assignments = await AgentAssignment.find({
                agent: req.user._id,
                active: true
            }).select('customer');
            const customerIds = assignments.map(a => a.customer);

            if (customerIds.length === 0) {
                return res.json({ success: true, count: 0, data: [] });
            }
            userFilter = { user: { $in: customerIds } };
        }

        const schemes = await Scheme.find({
            status: 'active',
            ...dateFilter,
            ...userFilter
        })
            .populate('user', 'name phone customerId address')
            .populate('branch', 'branchName branchCode')
            .sort({ nextDueDate: 1 });

        const data = schemes.map(s => ({
            schemeId: s._id,
            customerId: s.user?._id,
            customerName: s.user?.name || '—',
            planName: s.schemeName,
            amount: Number(s.currentInstallmentBalance || s.planAmount || s.monthlyAmount || 0),
            nextDueDate: s.nextDueDate,
            phone: s.user?.phone,
        }));

        res.json({ success: true, count: data.length, data });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// GET /api/agent/customers
router.get('/customers', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        let query = { role: 'customer' };
        let assignmentRecords = [];

        if (req.user.role === 'agent') {
            assignmentRecords = await AgentAssignment.find({
                agent: req.user._id,
                active: true
            })
                .select('customer assignmentType area scheme notes')
                .populate('scheme', 'schemeName schemeId');

            const customerIds = assignmentRecords
                .map((assignment) => assignment.customer)
                .filter(Boolean);

            if (customerIds.length === 0) {
                return res.json({ success: true, count: 0, total: 0, data: [] });
            }

            query._id = { $in: customerIds };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { customerId: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const users = await User.find(query)
            .select('name phone customerId email isVerified isActive createdAt')
            .sort('-createdAt')
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        let data = users;
        const visibleCustomerIds = users.map((user) => user._id);

        if (req.user.role === 'agent') {
            assignmentRecords = assignmentRecords.filter((assignment) =>
                visibleCustomerIds.some((customerId) => String(customerId) === String(assignment.customer))
            );

            const assignmentMap = new Map(
                assignmentRecords.map((assignment) => [
                    String(assignment.customer),
                    assignment
                ])
            );

            data = users.map((user) => {
                const assignment = assignmentMap.get(String(user._id));
                return {
                    ...user.toObject(),
                    assignmentType: assignment?.assignmentType || 'customer',
                    assignmentArea: assignment?.area || '',
                    assignmentScheme: assignment?.scheme || null,
                    assignmentNotes: assignment?.notes || ''
                    };
                });
        }

        if (visibleCustomerIds.length > 0) {
            const [schemes, latestPayments] = await Promise.all([
                Scheme.find({
                    user: { $in: visibleCustomerIds },
                    status: { $in: ['active', 'matured'] }
                })
                    .select('user schemeName schemeId monthlyAmount planAmount currentInstallmentBalance totalAmountPaid nextDueDate lastPaymentDate status')
                    .sort({ nextDueDate: 1 }),
                Payment.aggregate([
                    {
                        $match: {
                            user: { $in: visibleCustomerIds },
                            status: 'completed'
                        }
                    },
                    { $sort: { paymentDate: -1 } },
                    {
                        $group: {
                            _id: '$user',
                            lastPaymentDate: { $first: '$paymentDate' },
                            lastPaymentAmount: { $first: '$amount' },
                            lastPaymentMethod: { $first: '$paymentMethod' }
                        }
                    }
                ])
            ]);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const schemeMap = new Map();
            schemes.forEach((scheme) => {
                const key = String(scheme.user);
                if (!schemeMap.has(key)) {
                    schemeMap.set(key, []);
                }
                schemeMap.get(key).push(scheme);
            });

            const paymentMap = new Map(
                latestPayments.map((payment) => [String(payment._id), payment])
            );

            data = data.map((customer) => {
                const customerId = String(customer._id);
                const customerSchemes = schemeMap.get(customerId) || [];
                const activeSchemes = customerSchemes.filter((scheme) => scheme.status === 'active');
                const dueSchemes = activeSchemes.filter((scheme) => scheme.nextDueDate && new Date(scheme.nextDueDate) <= todayEnd);
                const overdueSchemes = activeSchemes.filter((scheme) => scheme.nextDueDate && new Date(scheme.nextDueDate) < new Date());
                const currentPlan = activeSchemes[0] || null;
                const nextDueDate = activeSchemes
                    .filter((scheme) => scheme.nextDueDate)
                    .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0]?.nextDueDate || null;
                const lastPayment = paymentMap.get(customerId) || null;

                return {
                    ...customer,
                    activeSchemeCount: activeSchemes.length,
                    maturedSchemeCount: customerSchemes.filter((scheme) => scheme.status === 'matured').length,
                    dueSchemeCount: dueSchemes.length,
                    overdueSchemeCount: overdueSchemes.length,
                    dueAmount: dueSchemes.reduce((sum, scheme) => sum + Number(scheme.currentInstallmentBalance || scheme.planAmount || scheme.monthlyAmount || 0), 0),
                    totalSchemePaid: customerSchemes.reduce((sum, scheme) => sum + Number(scheme.totalAmountPaid || 0), 0),
                    nextDueDate,
                    currentPlan: currentPlan ? {
                        id: currentPlan._id,
                        schemeId: currentPlan.schemeId,
                        schemeName: currentPlan.schemeName,
                        amount: Number(currentPlan.currentInstallmentBalance || currentPlan.planAmount || currentPlan.monthlyAmount || 0),
                        nextDueDate: currentPlan.nextDueDate,
                        status: currentPlan.status
                    } : null,
                    assignedSchemes: activeSchemes.slice(0, 3).map((scheme) => ({
                        id: scheme._id,
                        schemeId: scheme.schemeId,
                        schemeName: scheme.schemeName,
                        amount: Number(scheme.currentInstallmentBalance || scheme.planAmount || scheme.monthlyAmount || 0),
                        nextDueDate: scheme.nextDueDate,
                        status: scheme.status
                    })),
                    lastPayment: lastPayment ? {
                        date: lastPayment.lastPaymentDate,
                        amount: lastPayment.lastPaymentAmount,
                        method: lastPayment.lastPaymentMethod
                    } : null
                };
            });
        }

        res.json({ success: true, count: data.length, total, data });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/agent/collection-amounts
router.get('/collection-amounts', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const agent = await User.findById(req.user._id).select('agentProfile');
        const amounts = agent?.agentProfile?.collectionAmounts || [
            { id: '1', value: 500, label: '₹500' },
            { id: '2', value: 1000, label: '₹1000' },
            { id: '3', value: 2000, label: '₹2000' },
            { id: '4', value: 5000, label: '₹5000' },
        ];
        const defaultAmount = agent?.agentProfile?.defaultCollectionAmount || amounts[0]?.value;

        res.json({ success: true, data: { amounts, defaultAmount } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/agent/collection-amounts/log-usage
router.post('/collection-amounts/log-usage', protect, authorize('admin', 'agent'), async (req, res) => {
    res.json({ success: true });
});

// PUT /api/agent/collection-amounts/default/:amountId
router.put('/collection-amounts/default/:amountId', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const agent = await User.findById(req.user._id).select('agentProfile');
        const amounts = agent?.agentProfile?.collectionAmounts || [];
        const amount = amounts.find(a => a.id === req.params.amountId);

        if (!amount) return res.status(404).json({ success: false, message: 'Amount not found' });

        await User.findByIdAndUpdate(req.user._id, {
            'agentProfile.defaultCollectionAmount': amount.value
        });

        res.json({ success: true, message: 'Default amount updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/agent/collection-amounts
router.post('/collection-amounts', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const { value, label } = req.body;
        if (!value || value < 100) {
            return res.status(400).json({ success: false, message: 'Amount must be at least ₹100' });
        }

        const agent = await User.findById(req.user._id).select('agentProfile');
        const amounts = agent?.agentProfile?.collectionAmounts || [];

        const newAmount = { id: Date.now().toString(), value: parseFloat(value), label: label || `₹${value}` };
        amounts.push(newAmount);

        await User.findByIdAndUpdate(req.user._id, {
            'agentProfile.collectionAmounts': amounts
        });

        res.json({ success: true, data: { amounts, defaultAmount: agent?.agentProfile?.defaultCollectionAmount } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/agent/collection-amounts/:amountId
router.delete('/collection-amounts/:amountId', protect, authorize('admin', 'agent'), async (req, res) => {
    try {
        const agent = await User.findById(req.user._id).select('agentProfile');
        const amounts = (agent?.agentProfile?.collectionAmounts || [])
            .filter(a => a.id !== req.params.amountId);

        await User.findByIdAndUpdate(req.user._id, {
            'agentProfile.collectionAmounts': amounts
        });

        res.json({ success: true, data: { amounts, defaultAmount: agent?.agentProfile?.defaultCollectionAmount } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
