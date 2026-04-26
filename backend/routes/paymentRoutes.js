const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    getPaymentHistory,
    getPaymentById,
    getReceipt,
    downloadReceipt,
    getGroupedPaymentsForSelf
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/user/self', getGroupedPaymentsForSelf);
router.get('/', getPaymentHistory);
router.get('/:id', getPaymentById);
router.get('/:id/receipt', getReceipt);
router.get('/:id/download', downloadReceipt);

module.exports = router;
