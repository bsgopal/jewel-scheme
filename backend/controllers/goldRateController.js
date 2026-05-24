const GoldRate = require('../models/GoldRate');
const {
    fetchAndStoreLiveRate,
    getCurrentRateWithRefresh,
    getRateForPurity,
    isRateFresh
} = require('../services/goldRateFetcher');

// @desc    Get current gold rate
// @route   GET /api/gold-rate/current
// @access  Public
exports.getCurrentRate = async (req, res, next) => {
    try {
        const rate = await getCurrentRateWithRefresh();

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Gold rate not available. Please check live API configuration.'
            });
        }

        console.log('[goldRateController] getCurrentRate - Returning to frontend:', {
            silver: rate.silver,
            gold24K: rate.gold24K,
            gold22K: rate.gold22K,
            source: rate.source,
            date: rate.date
        });

        res.status(200).json({
            success: true,
            data: rate,
            fresh: isRateFresh(rate),
            meta: {
                rateDate: rate.date,
                fetchedAt: rate.fetchedAt || rate.updatedAt,
                providerUpdatedAt: rate.providerUpdatedAt || null,
                source: rate.source
            }
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

        const rate = await getCurrentRateWithRefresh();

        if (!rate) {
            return res.status(404).json({
                success: false,
                message: 'Gold rate not available'
            });
        }

        const goldRate = getRateForPurity(rate, purity);

        const goldWeight = parseFloat((parseFloat(amount) / goldRate).toFixed(4));

        res.status(200).json({
            success: true,
            data: {
                amount: parseFloat(amount),
                purity: purity.toUpperCase(),
                goldRate,
                goldWeight,
                rateDate: rate.date,
                rateFresh: isRateFresh(rate)
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

        const currentRate = await getCurrentRateWithRefresh();

        res.status(200).json({
            success: true,
            data: {
                currentRate,
                stats: stats[0] || {},
                period: `Last ${days} days`,
                rateFresh: isRateFresh(currentRate)
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Manually refresh gold rates from live API
// @route   POST /api/gold-rate/refresh
// @access  Public
exports.refreshRates = async (req, res, next) => {
    try {
        const updatedRate = await fetchAndStoreLiveRate();

        if (!updatedRate) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch live rates. Please check the configured provider API key and API availability.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Gold rates refreshed successfully',
            data: updatedRate
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Manually set gold rates (for development/testing)
// @route   POST /api/gold-rate/set
// @access  Public
exports.setRates = async (req, res, next) => {
    try {
        const { gold24K, gold22K, gold18K, silver } = req.body;

        if (!gold24K || !gold22K || !gold18K || !silver) {
            return res.status(400).json({
                success: false,
                message: 'Please provide gold24K, gold22K, gold18K, and silver rates'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingRate = await GoldRate.findOne({
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        const rateData = {
            date: today,
            gold24K: Number(gold24K),
            gold22K: Number(gold22K),
            gold18K: Number(gold18K),
            silver: Number(silver),
            source: 'manual',
            fetchedAt: new Date(),
            isActive: true,
            notes: `Manually set at ${new Date().toISOString()}`
        };

        let updatedRate;
        if (existingRate) {
            existingRate.set(rateData);
            updatedRate = await existingRate.save();
        } else {
            updatedRate = await GoldRate.create(rateData);
        }

        res.status(200).json({
            success: true,
            message: 'Gold rates set successfully',
            data: updatedRate
        });
    } catch (error) {
        next(error);
    }
};
