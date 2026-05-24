const express = require('express');
const router = express.Router();
const {
    createRedemption,
    getUserRedemptions,
    getRedemptionByBillNumber,
    getRedemptionById,
    cancelRedemption,
    submitFeedback
} = require('../controllers/redemptionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .get(getUserRedemptions)
    .post(createRedemption);

router.get('/bill/:billNumber', getRedemptionByBillNumber);

router.route('/:id')
    .get(getRedemptionById);

router.put('/:id/cancel', cancelRedemption);
router.put('/:id/feedback', submitFeedback);

module.exports = router;
