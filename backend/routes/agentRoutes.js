const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Scheme = require('../models/Scheme');
const User = require('../models/User');

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
            amount: s.monthlyAmount,
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

        if (req.user.role === 'agent') {
            query.assignedAgent = req.user._id;
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
        res.json({ success: true, count: users.length, total, data: users });

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