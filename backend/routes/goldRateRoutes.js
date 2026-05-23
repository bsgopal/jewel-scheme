const express = require('express');
const router = express.Router();
const {
    getCurrentRate,
    getRateHistory,
    getRateByDate,
    calculateGoldWeight,
    getRateStats,
    refreshRates
} = require('../controllers/goldRateController');

// All public
router.get('/current', getCurrentRate);
router.get('/history', getRateHistory);
router.get('/stats', getRateStats);
router.get('/calculate', calculateGoldWeight);
router.get('/date/:date', getRateByDate);
router.post('/refresh', refreshRates);

module.exports = router;
