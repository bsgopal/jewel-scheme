const fs = require('fs');
const path = require('path');
const multer = require('multer');
const PlanCatalog = require('../models/PlanCatalog');
const Scheme = require('../models/Scheme');
const Payment = require('../models/Payment');

const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => cb(null, `plan-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

const normalizeBenefits = (payload = {}) => {
    if (payload.makingChargeDiscount !== undefined) {
        return payload;
    }

    return {
        makingChargeDiscount: Number(payload.makingChargeDiscount || 0),
        wastageDiscount: Number(payload.wastageDiscount || 0),
        diamondDiscount: Number(payload.diamondDiscount || 0),
        extraBonusPercentage: Number(payload.extraBonusPercentage || 0)
    };
};

const normalizePlan = (plan) => ({
    id: plan._id,
    name: plan.name,
    plan_name: plan.name,
    type: plan.schemeType,
    plan_type: plan.planType,
    jewellery_type: plan.jewelleryType,
    minAmount: plan.minAmount,
    maxAmount: plan.maxAmount,
    amount_per_inst: plan.minAmount,
    totalInstallments: plan.totalInstallments,
    duration: plan.totalInstallments,
    tenure: plan.tenure,
    description: plan.description,
    note: plan.description,
    features: plan.features,
    terms: plan.terms,
    benefits: plan.benefits,
    bonusPercentage: plan.bonusPercentage,
    popular: plan.popular,
    priority: plan.priority,
    imageUrl: plan.imageUrl,
    banner_path: plan.imageUrl,
    active: plan.active,
    groupCode: plan.groupCode,
    createdAt: plan.createdAt,
    source: 'catalog'
});

exports.planImageUpload = upload.single('image');

exports.uploadPlanImage = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
        success: true,
        url: `/uploads/${req.file.filename}`
    });
};

exports.getPlans = async (req, res, next) => {
    try {
        const includeAll = req.query.include_all === 'true';
        const query = includeAll ? {} : { active: true };
        const plans = await PlanCatalog.find(query).sort({ priority: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: plans.length,
            data: plans.map(normalizePlan)
        });
    } catch (error) {
        next(error);
    }
};

exports.getPlanById = async (req, res, next) => {
    try {
        const plan = await PlanCatalog.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        res.status(200).json({ success: true, data: normalizePlan(plan) });
    } catch (error) {
        next(error);
    }
};

exports.createPlan = async (req, res, next) => {
    try {
        const plan = await PlanCatalog.create({
            groupCode: req.body.groupCode || '',
            name: req.body.name || req.body.planName,
            planType: req.body.planType || 'Monthly',
            schemeType: req.body.schemeType || (req.body.isFlexible ? 'flexible' : 'monthly'),
            jewelleryType: req.body.jewelleryType || 'All',
            minAmount: Number(req.body.minAmount ?? req.body.amountPerInst ?? 0),
            maxAmount: Number(req.body.maxAmount ?? req.body.totalBalance ?? req.body.amountPerInst ?? 0),
            totalInstallments: Number(req.body.totalInstallments ?? req.body.duration ?? 11),
            tenure: req.body.tenure || `${Number(req.body.totalInstallments ?? req.body.duration ?? 11)} months`,
            description: req.body.description ?? req.body.note ?? '',
            features: req.body.features ?? [],
            terms: req.body.terms ?? [],
            benefits: normalizeBenefits(req.body.benefits ?? {}),
            bonusPercentage: Number(req.body.bonusPercentage ?? req.body.bonus ?? 0),
            priority: Number(req.body.priority ?? 1),
            imageUrl: req.body.imageUrl ?? req.body.bannerPreview ?? '',
            popular: Boolean(req.body.popular),
            isFlexible: Boolean(req.body.isFlexible),
            active: req.body.active ?? String(req.body.status || '').toLowerCase() !== 'inactive',
            createdBy: req.user?._id,
            updatedBy: req.user?._id
        });

        res.status(201).json({ success: true, data: normalizePlan(plan) });
    } catch (error) {
        next(error);
    }
};

exports.updatePlan = async (req, res, next) => {
    try {
        const plan = await PlanCatalog.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        Object.assign(plan, {
            groupCode: req.body.groupCode ?? plan.groupCode,
            name: req.body.name ?? req.body.planName ?? plan.name,
            planType: req.body.planType ?? plan.planType,
            schemeType: req.body.schemeType ?? plan.schemeType,
            jewelleryType: req.body.jewelleryType ?? plan.jewelleryType,
            minAmount: Number(req.body.minAmount ?? req.body.amountPerInst ?? plan.minAmount),
            maxAmount: Number(req.body.maxAmount ?? req.body.totalBalance ?? plan.maxAmount ?? plan.minAmount),
            totalInstallments: Number(req.body.totalInstallments ?? req.body.duration ?? plan.totalInstallments),
            tenure: req.body.tenure ?? plan.tenure,
            description: req.body.description ?? req.body.note ?? plan.description,
            features: req.body.features ?? plan.features,
            terms: req.body.terms ?? plan.terms,
            benefits: req.body.benefits ? normalizeBenefits(req.body.benefits) : plan.benefits,
            bonusPercentage: Number(req.body.bonusPercentage ?? req.body.bonus ?? plan.bonusPercentage),
            priority: Number(req.body.priority ?? plan.priority),
            imageUrl: req.body.imageUrl ?? req.body.bannerPreview ?? plan.imageUrl,
            popular: req.body.popular ?? plan.popular,
            isFlexible: req.body.isFlexible ?? plan.isFlexible,
            active: req.body.active ?? (req.body.status ? String(req.body.status).toLowerCase() !== 'inactive' : plan.active),
            updatedBy: req.user?._id
        });

        await plan.save();
        res.status(200).json({ success: true, data: normalizePlan(plan) });
    } catch (error) {
        next(error);
    }
};

exports.deletePlan = async (req, res, next) => {
    try {
        const plan = await PlanCatalog.findById(req.params.id);
        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        const linkedSchemes = await Scheme.find({
            $or: [
                { catalogPlan: plan._id },
                { schemeName: plan.name }
            ]
        }).select('_id');

        if (linkedSchemes.length > 0) {
            const linkedSchemeIds = linkedSchemes.map((scheme) => scheme._id);
            const paymentCount = await Payment.countDocuments({ scheme: { $in: linkedSchemeIds } });

            return res.status(400).json({
                success: false,
                message: paymentCount > 0
                    ? 'This plan cannot be deleted because customers have already joined it and payment history exists.'
                    : 'This plan cannot be deleted because customers have already joined it.'
            });
        }

        await plan.deleteOne();

        res.status(200).json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        next(error);
    }
};
