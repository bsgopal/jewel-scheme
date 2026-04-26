const path = require('path');
const multer = require('multer');
const Offer = require('../models/Offer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const fileType = req.body.fileType || 'offer';
        cb(null, `${fileType}-${Date.now()}${path.extname(file.originalname)}`)
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const fileType = req.body.fileType || 'offer';
        if (fileType === 'pdf' && !file.mimetype.includes('pdf')) {
            return cb(new Error('Only PDF files allowed for PDF upload'));
        }
        if (fileType === 'image' && !file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files allowed'));
        }
        cb(null, true);
    }
});

const normalizeOffer = (offer) => ({
    id: offer._id,
    title: offer.title,
    subtitle: offer.subtitle,
    description: offer.description,
    bonus_value: offer.bonusValue,
    image_url: offer.imageUrl,
    banner_url: offer.bannerUrl,
    pdf_url: offer.pdfUrl,
    type: offer.type,
    valid_from: offer.validFrom,
    valid_to: offer.validTo,
    active: offer.active,
    priority: offer.priority,
    target_roles: offer.targetRoles,
    created_at: offer.createdAt,
    updated_at: offer.updatedAt
});

exports.offerUpload = upload.single('file');

exports.uploadOfferAsset = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
        success: true,
        url: `/uploads/${req.file.filename}`
    });
};

exports.getOffers = async (req, res, next) => {
    try {
        const role = req.user?.role;
        const now = new Date();
        const canManage = role && ['admin', 'staff'].includes(role) && req.query.include_all === 'true';
        const query = canManage ? {} : {
            active: true,
            validTo: { $gte: now }
        };

        if (role && !canManage) {
            query.$or = [
                { targetRoles: { $size: 0 } },
                { targetRoles: role }
            ];
        }

        const offers = await Offer.find(query).sort({ priority: -1, validTo: 1, createdAt: -1 });
        res.status(200).json(offers.map(normalizeOffer));
    } catch (error) {
        next(error);
    }
};

exports.getOfferById = async (req, res, next) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        res.status(200).json(normalizeOffer(offer));
    } catch (error) {
        next(error);
    }
};

exports.createOffer = async (req, res, next) => {
    try {
        const role = req.user?.role;
        
        // Only admin and staff can create offers
        if (!role || !['admin', 'staff'].includes(role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only admin and staff can create offers' 
            });
        }

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url ?? req.body.imageUrl ?? '');
        const bannerUrl = req.body.banner_url ?? req.body.bannerUrl ?? '';
        const pdfUrl = req.body.pdf_url ?? req.body.pdfUrl ?? '';
        
        // Determine offer type
        let offerType = req.body.type ?? 'standard';
        if (bannerUrl && !pdfUrl) offerType = 'banner';
        if (pdfUrl && !bannerUrl) offerType = 'pdf';
        if (bannerUrl && pdfUrl) offerType = 'banner'; // banner takes precedence

        const offer = await Offer.create({
            title: req.body.title,
            subtitle: req.body.subtitle,
            description: req.body.description,
            bonusValue: req.body.bonus_value ?? req.body.bonusValue ?? req.body.bonus ?? 0,
            imageUrl,
            bannerUrl,
            pdfUrl,
            type: offerType,
            validFrom: req.body.valid_from ?? req.body.validFrom ?? new Date(),
            validTo: req.body.valid_to ?? req.body.validTo ?? req.body.validTill,
            targetRoles: req.body.target_roles ?? req.body.targetRoles ?? [],
            priority: req.body.priority ?? 0,
            active: req.body.active ?? true,
            createdBy: req.user?._id
        });

        res.status(201).json({ success: true, data: normalizeOffer(offer) });
    } catch (error) {
        next(error);
    }
};

exports.updateOffer = async (req, res, next) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const role = req.user?.role;
        if (!role || !['admin', 'staff'].includes(role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only admin and staff can update offers' 
            });
        }

        const newImageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url ?? req.body.imageUrl ?? offer.imageUrl);
        const bannerUrl = req.body.banner_url ?? req.body.bannerUrl ?? offer.bannerUrl;
        const pdfUrl = req.body.pdf_url ?? req.body.pdfUrl ?? offer.pdfUrl;

        let offerType = req.body.type ?? offer.type;
        if (bannerUrl && !pdfUrl) offerType = 'banner';
        if (pdfUrl && !bannerUrl) offerType = 'pdf';
        if (bannerUrl && pdfUrl) offerType = 'banner';

        Object.assign(offer, {
            title: req.body.title ?? offer.title,
            subtitle: req.body.subtitle ?? offer.subtitle,
            description: req.body.description ?? offer.description,
            bonusValue: req.body.bonus_value ?? req.body.bonusValue ?? req.body.bonus ?? offer.bonusValue,
            imageUrl: newImageUrl,
            bannerUrl,
            pdfUrl,
            type: offerType,
            validFrom: req.body.valid_from ?? req.body.validFrom ?? offer.validFrom,
            validTo: req.body.valid_to ?? req.body.validTo ?? req.body.validTill ?? offer.validTo,
            targetRoles: req.body.target_roles ?? req.body.targetRoles ?? offer.targetRoles,
            priority: req.body.priority ?? offer.priority,
            active: req.body.active ?? offer.active
        });

        await offer.save();
        res.status(200).json({ success: true, data: normalizeOffer(offer) });
    } catch (error) {
        next(error);
    }
};

exports.deleteOffer = async (req, res, next) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        res.status(200).json({ success: true, message: 'Offer deleted successfully' });
    } catch (error) {
        next(error);
    }
};
