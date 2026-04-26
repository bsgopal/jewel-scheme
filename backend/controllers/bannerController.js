const path = require('path');
const multer = require('multer');
const Banner = require('../models/Banner');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `banner-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

const normalizeBanner = (banner) => ({
    id: banner._id,
    title: banner.title,
    subtitle: banner.subtitle,
    description: banner.description,
    image_url: banner.imageUrl,
    cta_label: banner.ctaLabel,
    cta_route: banner.ctaRoute,
    target_roles: banner.targetRoles,
    active: banner.active,
    priority: banner.priority,
    created_at: banner.createdAt,
    updated_at: banner.updatedAt
});

exports.bannerUpload = upload.single('image');

exports.uploadBannerAsset = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
        success: true,
        url: `/uploads/${req.file.filename}`
    });
};

exports.getBanners = async (req, res, next) => {
    try {
        const role = req.user?.role;
        const canManage = role && ['admin', 'staff'].includes(role) && req.query.include_all === 'true';
        const query = canManage ? {} : { active: true };

        if (role && !['admin', 'staff'].includes(role)) {
            query.$or = [
                { targetRoles: { $size: 0 } },
                { targetRoles: role }
            ];
        }

        const banners = await Banner.find(query).sort({ priority: 1, createdAt: -1 });
        res.status(200).json(banners.map(normalizeBanner));
    } catch (error) {
        next(error);
    }
};

exports.createBanner = async (req, res, next) => {
    try {
        const banner = await Banner.create({
            title: req.body.title,
            subtitle: req.body.subtitle ?? '',
            description: req.body.description ?? '',
            imageUrl: req.body.image_url ?? req.body.imageUrl ?? '',
            ctaLabel: req.body.cta_label ?? req.body.ctaLabel ?? '',
            ctaRoute: req.body.cta_route ?? req.body.ctaRoute ?? '',
            targetRoles: req.body.target_roles ?? req.body.targetRoles ?? [],
            active: req.body.active ?? true,
            priority: Number(req.body.priority ?? 1),
            createdBy: req.user?._id
        });

        res.status(201).json({ success: true, data: normalizeBanner(banner) });
    } catch (error) {
        next(error);
    }
};

exports.updateBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        Object.assign(banner, {
            title: req.body.title ?? banner.title,
            subtitle: req.body.subtitle ?? banner.subtitle,
            description: req.body.description ?? banner.description,
            imageUrl: req.body.image_url ?? req.body.imageUrl ?? banner.imageUrl,
            ctaLabel: req.body.cta_label ?? req.body.ctaLabel ?? banner.ctaLabel,
            ctaRoute: req.body.cta_route ?? req.body.ctaRoute ?? banner.ctaRoute,
            targetRoles: req.body.target_roles ?? req.body.targetRoles ?? banner.targetRoles,
            active: req.body.active ?? banner.active,
            priority: Number(req.body.priority ?? banner.priority)
        });

        await banner.save();
        res.status(200).json({ success: true, data: normalizeBanner(banner) });
    } catch (error) {
        next(error);
    }
};

exports.deleteBanner = async (req, res, next) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        res.status(200).json({ success: true, message: 'Banner deleted successfully' });
    } catch (error) {
        next(error);
    }
};
