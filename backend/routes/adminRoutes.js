const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    updateGoldRate,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAllSchemes,
    updateScheme,
    getAllPayments,
    updatePayment,
    deletePayment,
    getAllRedemptions,
    approveRedemption,
    rejectRedemption,
    markDelivered,
    createBranch,
    getAllBranches,
    getOperationalInsights
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect, admin);

// Dashboard
router.get('/dashboard', getDashboardStats);
router.get('/operational-insights', getOperationalInsights);

// Gold Rate
router.post('/gold-rate', updateGoldRate);

// Users
router.get('/users', getAllUsers);
router.route('/users/:id')
    .get(getUserById)
    .put(updateUser)
    .delete(deleteUser);

// Schemes
router.get('/schemes', getAllSchemes);
router.put('/schemes/:id', updateScheme);

// Payments
router.get('/payments', getAllPayments);
router.route('/payments/:id')
    .put(updatePayment)
    .delete(deletePayment);

// Redemptions
router.get('/redemptions', getAllRedemptions);
router.put('/redemptions/:id/approve', approveRedemption);
router.put('/redemptions/:id/reject', rejectRedemption);
router.put('/redemptions/:id/deliver', markDelivered);

// Branches
router.route('/branches')
    .get(getAllBranches)
    .post(createBranch);

module.exports = router;
