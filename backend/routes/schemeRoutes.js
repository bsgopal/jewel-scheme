const express = require('express');
const router = express.Router();
const {
    getSchemePlans,
    createScheme,
    getUserSchemes,
    getSchemeById,
    payInstallment,
    getSchemeSummary,
    cancelScheme
} = require('../controllers/schemeController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', getSchemePlans);

// Protected routes
router.use(protect);

router.get('/summary', getSchemeSummary);
router.route('/')
    .get(getUserSchemes)
    .post(createScheme);

router.route('/:id')
    .get(getSchemeById);

router.post('/:id/pay', payInstallment);
router.put('/:id/cancel', cancelScheme);

module.exports = router;