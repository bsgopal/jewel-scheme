const express = require('express');
const router = express.Router();
const {
    getWallet,
    addMoney,
    convertToGold,
    getWalletHistory,
    payInstallmentFromWallet
} = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/history/:userId', getWalletHistory);
router.get('/:userId', getWallet);
router.post('/add', addMoney);
router.post('/convert', convertToGold);
router.post('/pay-installment', payInstallmentFromWallet);

module.exports = router;
