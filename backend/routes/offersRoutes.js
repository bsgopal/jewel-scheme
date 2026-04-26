const express = require('express');
const router = express.Router();
const {
    getOffers,
    getOfferById,
    createOffer,
    updateOffer,
    deleteOffer,
    offerUpload,
    uploadOfferAsset
} = require('../controllers/offersController');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

router.get('/', optionalAuth, getOffers);
router.post('/upload', protect, authorize('admin', 'staff'), offerUpload, uploadOfferAsset);
router.get('/:id', optionalAuth, getOfferById);
router.post('/', protect, authorize('admin', 'staff'), offerUpload, createOffer);
router.put('/:id', protect, authorize('admin', 'staff'), offerUpload, updateOffer);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteOffer);

module.exports = router;
