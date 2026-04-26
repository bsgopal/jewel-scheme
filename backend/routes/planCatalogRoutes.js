const express = require('express');
const router = express.Router();
const {
    getPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    planImageUpload,
    uploadPlanImage
} = require('../controllers/planCatalogController');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

router.get('/', optionalAuth, getPlans);
router.get('/:id', optionalAuth, getPlanById);
router.post('/upload', protect, authorize('admin'), planImageUpload, uploadPlanImage);
router.post('/', protect, authorize('admin'), createPlan);
router.put('/:id', protect, authorize('admin'), updatePlan);
router.delete('/:id', protect, authorize('admin'), deletePlan);

module.exports = router;
