const express = require('express');
const router = express.Router();
const {
    getBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    bannerUpload,
    uploadBannerAsset
} = require('../controllers/bannerController');
const { optionalAuth, protect, authorize } = require('../middleware/auth');

router.get('/', optionalAuth, getBanners);
router.post('/upload', protect, authorize('admin', 'staff'), bannerUpload, uploadBannerAsset);
router.post('/', protect, authorize('admin', 'staff'), createBanner);
router.put('/:id', protect, authorize('admin', 'staff'), updateBanner);
router.delete('/:id', protect, authorize('admin', 'staff'), deleteBanner);

module.exports = router;
