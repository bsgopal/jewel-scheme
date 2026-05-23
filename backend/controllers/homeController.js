const NewArrival = require('../models/NewArrivals');
const Offer = require('../models/Offer');
const Banner = require('../models/Banner');
const PlanCatalog = require('../models/PlanCatalog');
const SCHEME_PLANS = require('../config/schemePlans');
const { getCurrentRateWithRefresh } = require('../services/goldRateFetcher');

const normalizeBanner = (banner) => ({
    id: banner._id,
    title: banner.title,
    subtitle: banner.subtitle,
    description: banner.description,
    image_url: banner.imageUrl,
    cta_label: banner.ctaLabel,
    cta_route: banner.ctaRoute,
    priority: banner.priority
});

exports.getHomeContent = async (req, res, next) => {
    try {
        const role = req.user?.role;
        const offersQuery = {
            active: true,
            validTo: { $gte: new Date() }
        };

        if (role) {
            offersQuery.$or = [
                { targetRoles: { $size: 0 } },
                { targetRoles: role }
            ];
        }

        const bannerQuery = { active: true };
        if (role && !['admin', 'staff'].includes(role)) {
            bannerQuery.$or = [
                { targetRoles: { $size: 0 } },
                { targetRoles: role }
            ];
        }

        const [rates, arrivals, offers, banners, catalogPlans] = await Promise.all([
            getCurrentRateWithRefresh(),
            NewArrival.find().sort({ createdAt: -1 }).limit(8),
            Offer.find(offersQuery).sort({ validTo: 1, createdAt: -1 }).limit(6),
            Banner.find(bannerQuery).sort({ priority: 1, createdAt: -1 }).limit(8),
            PlanCatalog.find({ active: true }).sort({ priority: 1, createdAt: -1 }).limit(8)
        ]);

        const fallbackPlanBanners = SCHEME_PLANS.slice(0, 3).map((plan, index) => ({
            id: `plan-${plan.name}`,
            title: plan.name,
            subtitle: plan.popular ? 'Popular savings plan' : 'Jewellery savings plan',
            description: plan.description,
            image_url: '',
            cta_label: 'View plan',
            cta_route: '/newplan',
            priority: index + 1
        }));

        // Convert offers with banners to banner format
        const offerBanners = offers
            .filter(offer => offer.bannerUrl && offer.type === 'banner')
            .map((offer, index) => ({
                id: `offer-${offer._id}`,
                title: offer.title,
                subtitle: offer.subtitle || `${offer.bonusValue}% Bonus`,
                description: offer.description,
                image_url: offer.bannerUrl,
                cta_label: 'View offer',
                cta_route: `/offers/${offer._id}`,
                priority: -100 + index, // Higher priority for offers
                type: 'offer'
            }));

        const plans = catalogPlans.length
            ? catalogPlans.map((plan) => ({
                id: plan._id,
                name: plan.name,
                type: plan.schemeType,
                plan_type: plan.planType,
                jewellery_type: plan.jewelleryType,
                minAmount: plan.minAmount,
                maxAmount: plan.maxAmount,
                totalInstallments: plan.totalInstallments,
                tenure: plan.tenure,
                description: plan.description,
                features: plan.features,
                benefits: plan.benefits,
                popular: plan.popular,
                imageUrl: plan.imageUrl,
                active: plan.active
            }))
            : SCHEME_PLANS;

        // Combine banners with offer banners and sort by priority
        const allBanners = [
            ...offerBanners,
            ...banners.map(normalizeBanner)
        ].sort((a, b) => (b.priority || 0) - (a.priority || 0));

        res.status(200).json({
            success: true,
            data: {
                rates: rates || {},
                banners: allBanners.length ? allBanners : fallbackPlanBanners,
                arrivals: arrivals.map((item) => ({
                    id: item._id,
                    title: item.title,
                    price: item.price,
                    offer: item.offer,
                    image_url: item.imageUrl,
                    created_at: item.createdAt
                })),
                offers: offers.map((offer) => ({
                    id: offer._id,
                    title: offer.title,
                    subtitle: offer.subtitle,
                    description: offer.description,
                    bonus_value: offer.bonusValue,
                    image_url: offer.imageUrl,
                    banner_url: offer.bannerUrl,
                    pdf_url: offer.pdfUrl,
                    type: offer.type,
                    valid_to: offer.validTo
                })),
                plans
            }
        });
    } catch (error) {
        next(error);
    }
};
