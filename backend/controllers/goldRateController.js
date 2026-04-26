const GoldRate = require('../models/GoldRate');

// @desc    Get current gold rate
// @route   GET /api/gold-rate/current
// @access  Public
exports.getCurrentRate = async (req, res, next) => {
    try {
        const rate = await GoldRate.getCurrentRate();

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Gold rate not available'
            });
        }

        res.status(200).json({
            success: true,
            data: rate
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get gold rate history
// @route   GET /api/gold-rate/history
// @access  Public
exports.getRateHistory = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;

        const rates = await GoldRate.getHistory(parseInt(days));

        res.status(200).json({
            success: true,
            count: rates.length,
            data: rates
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get gold rate for specific date
// @route   GET /api/gold-rate/date/:date
// @access  Public
exports.getRateByDate = async (req, res, next) => {
    try {
        const { date } = req.params;

        const rate = await GoldRate.getRateForDate(date);

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Gold rate not available for this date'
            });
        }

        res.status(200).json({
            success: true,
            data: rate
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Calculate gold weight for amount
// @route   GET /api/gold-rate/calculate
// @access  Public
exports.calculateGoldWeight = async (req, res, next) => {
    try {
        const { amount, purity = '22K' } = req.query;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid amount'
            });
        }

        const rate = await GoldRate.getCurrentRate();

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Gold rate not available'
            });
        }

        let goldRate;
        switch (purity.toUpperCase()) {
            case '24K':
                goldRate = rate.gold24K;
                break;
            case '18K':
                goldRate = rate.gold18K;
                break;
            default:
                goldRate = rate.gold22K;
        }

        const goldWeight = parseFloat((parseFloat(amount) / goldRate).toFixed(4));

        res.status(200).json({
            success: true,
            data: {
                amount: parseFloat(amount),
                purity: purity.toUpperCase(),
                goldRate,
                goldWeight,
                rateDate: rate.date
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get rate statistics
// @route   GET /api/gold-rate/stats
// @access  Public
exports.getRateStats = async (req, res, next) => {
    try {
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const stats = await GoldRate.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    avgGold22K: { $avg: '$gold22K' },
                    avgGold24K: { $avg: '$gold24K' },
                    minGold22K: { $min: '$gold22K' },
                    maxGold22K: { $max: '$gold22K' },
                    minGold24K: { $min: '$gold24K' },
                    maxGold24K: { $max: '$gold24K' },
                    avgSilver: { $avg: '$silver' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const currentRate = await GoldRate.getCurrentRate();

        res.status(200).json({
            success: true,
            data: {
                currentRate,
                stats: stats[0] || {},
                period: `Last ${days} days`
            }
        });

    } catch (error) {
        next(error);
    }
};