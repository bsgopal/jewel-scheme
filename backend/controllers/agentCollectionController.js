const AgentCollectionAmount = require('../models/AgentCollectionAmount');
const User = require('../models/User');

// @desc    Get agent's collection amounts
// @route   GET /api/agent/collection-amounts
// @access  Private
exports.getCollectionAmounts = async (req, res, next) => {
    try {
        let amounts = await AgentCollectionAmount.findOne({ agent: req.user._id });

        if (!amounts) {
            // Create default collection amounts for new agent
            amounts = await AgentCollectionAmount.create({
                agent: req.user._id,
                amounts: [
                    { value: 500, label: '500 - Quick Pay', isActive: true },
                    { value: 1000, label: '1000 - Standard', isActive: true },
                    { value: 2000, label: '2000 - Premium', isActive: true },
                    { value: 5000, label: '5000 - High Value', isActive: true }
                ],
                defaultAmount: 1000
            });
        }

        res.status(200).json({
            success: true,
            data: {
                amounts: amounts.amounts.filter(a => a.isActive),
                defaultAmount: amounts.defaultAmount,
                totalCollections: amounts.totalCollections,
                lastUsedAmount: amounts.lastUsedAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add new collection amount
// @route   POST /api/agent/collection-amounts
// @access  Private
exports.addCollectionAmount = async (req, res, next) => {
    try {
        const { value, label, isDefault } = req.body;

        // Validate
        if (!value || value < 100 || value > 100000) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be between ₹100 and ₹100,000'
            });
        }

        let amounts = await AgentCollectionAmount.findOne({ agent: req.user._id });

        if (!amounts) {
            amounts = await AgentCollectionAmount.create({
                agent: req.user._id,
                amounts: [{
                    value,
                    label: label || `₹${value}`,
                    isActive: true
                }],
                defaultAmount: isDefault ? value : 1000
            });
        } else {
            // Check if amount already exists
            const exists = amounts.amounts.some(a => a.value === value && a.isActive);
            if (exists) {
                return res.status(400).json({
                    success: false,
                    message: 'This amount already exists'
                });
            }

            amounts.amounts.push({
                value,
                label: label || `₹${value}`,
                isActive: true
            });

            if (isDefault) {
                amounts.defaultAmount = value;
            }

            await amounts.save();
        }

        res.status(201).json({
            success: true,
            message: 'Amount added successfully',
            data: {
                amounts: amounts.amounts.filter(a => a.isActive),
                defaultAmount: amounts.defaultAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update collection amount
// @route   PUT /api/agent/collection-amounts/:amountId
// @access  Private
exports.updateCollectionAmount = async (req, res, next) => {
    try {
        const { amountId } = req.params;
        const { value, label, isActive, isDefault } = req.body;

        const amounts = await AgentCollectionAmount.findOne({ agent: req.user._id });

        if (!amounts) {
            return res.status(404).json({
                success: false,
                message: 'Collection amounts not found'
            });
        }

        const amount = amounts.amounts.find(a => a.id === amountId);
        if (!amount) {
            return res.status(404).json({
                success: false,
                message: 'Amount not found'
            });
        }

        if (value && value < 100 || value > 100000) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be between ₹100 and ₹100,000'
            });
        }

        // Update amount properties
        if (value) amount.value = value;
        if (label) amount.label = label;
        if (isActive !== undefined) amount.isActive = isActive;

        if (isDefault) {
            amounts.defaultAmount = amount.value;
        }

        amounts.lastUpdated = new Date();
        await amounts.save();

        res.status(200).json({
            success: true,
            message: 'Amount updated successfully',
            data: {
                amounts: amounts.amounts.filter(a => a.isActive),
                defaultAmount: amounts.defaultAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete collection amount
// @route   DELETE /api/agent/collection-amounts/:amountId
// @access  Private
exports.deleteCollectionAmount = async (req, res, next) => {
    try {
        const { amountId } = req.params;

        const amounts = await AgentCollectionAmount.findOne({ agent: req.user._id });

        if (!amounts) {
            return res.status(404).json({
                success: false,
                message: 'Collection amounts not found'
            });
        }

        // Soft delete - mark as inactive
        const amount = amounts.amounts.find(a => a.id === amountId);
        if (!amount) {
            return res.status(404).json({
                success: false,
                message: 'Amount not found'
            });
        }

        if (amounts.amounts.filter(a => a.isActive).length <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the last amount. Add another amount first.'
            });
        }

        amount.isActive = false;
        amounts.lastUpdated = new Date();
        await amounts.save();

        res.status(200).json({
            success: true,
            message: 'Amount deleted successfully',
            data: {
                amounts: amounts.amounts.filter(a => a.isActive),
                defaultAmount: amounts.defaultAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Set default collection amount
// @route   PUT /api/agent/collection-amounts/default/:amountId
// @access  Private
exports.setDefaultAmount = async (req, res, next) => {
    try {
        const { amountId } = req.params;

        const amounts = await AgentCollectionAmount.findOne({ agent: req.user._id });

        if (!amounts) {
            return res.status(404).json({
                success: false,
                message: 'Collection amounts not found'
            });
        }

        const amount = amounts.amounts.find(a => a.id === amountId);
        if (!amount) {
            return res.status(404).json({
                success: false,
                message: 'Amount not found'
            });
        }

        amounts.defaultAmount = amount.value;
        amounts.lastUpdated = new Date();
        await amounts.save();

        res.status(200).json({
            success: true,
            message: 'Default amount set successfully',
            data: {
                defaultAmount: amounts.defaultAmount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Log collection amount usage
// @route   POST /api/agent/collection-amounts/log-usage
// @access  Private
exports.logAmountUsage = async (req, res, next) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: 'Amount is required'
            });
        }

        let agentAmounts = await AgentCollectionAmount.findOne({ agent: req.user._id });

        if (!agentAmounts) {
            agentAmounts = await AgentCollectionAmount.create({
                agent: req.user._id,
                amounts: [{ value: amount, isActive: true }],
                defaultAmount: amount,
                totalCollections: 1,
                lastUsedAmount: amount
            });
        } else {
            agentAmounts.totalCollections += 1;
            agentAmounts.lastUsedAmount = amount;
            await agentAmounts.save();
        }

        res.status(200).json({
            success: true,
            message: 'Usage logged'
        });
    } catch (error) {
        next(error);
    }
};
