const SCHEME_PLANS = [
    {
        name: 'SuperGold',
        type: 'monthly',
        minAmount: 1000,
        maxAmount: 100000,
        tenure: '11 months',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 75,
            wastageDiscount: 75,
            diamondDiscount: 60
        },
        description: 'Our most popular scheme! Save monthly and get 75% off on making charges.',
        features: ['Flexible amount from Rs 1,000', 'Gold rate locked on payment day', 'Bonus up to 1.25%', 'Free insurance'],
        popular: true
    },
    {
        name: 'DigiGold',
        type: 'flexible',
        minAmount: 100,
        maxAmount: 50000,
        tenure: '330 days',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 50,
            wastageDiscount: 50,
            diamondDiscount: 40
        },
        description: 'Start your gold savings journey with just Rs 100. Save anytime, any amount.',
        features: ['No fixed installments', 'Start from Rs 100', 'Tiered bonus system', 'Digital gold accumulation'],
        popular: false
    },
    {
        name: 'FlexiGold',
        type: 'flexible',
        minAmount: 500,
        maxAmount: 75000,
        tenure: '1 year',
        totalInstallments: 12,
        benefits: {
            makingChargeDiscount: 60,
            wastageDiscount: 60,
            diamondDiscount: 50
        },
        description: 'Maximum flexibility with excellent benefits. Pay weekly or monthly.',
        features: ['Weekly/Monthly options', 'Auto-debit available', 'Transfer between schemes', 'Family sharing'],
        popular: false
    },
    {
        name: 'DiamondSaver',
        type: 'monthly',
        minAmount: 2000,
        maxAmount: 200000,
        tenure: '11 months',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 50,
            wastageDiscount: 50,
            diamondDiscount: 75
        },
        description: 'Special scheme for diamond jewellery lovers. Get 75% off on diamond jewellery.',
        features: ['Best for diamond purchases', 'Priority access to collections', 'Special diamond discount', 'VIP customer service'],
        popular: false
    },
    {
        name: 'PremiumGold',
        type: 'monthly',
        minAmount: 5000,
        maxAmount: 500000,
        tenure: '11 months',
        totalInstallments: 11,
        benefits: {
            makingChargeDiscount: 100,
            wastageDiscount: 100,
            diamondDiscount: 75,
            extraBonusPercentage: 2
        },
        description: 'Premium scheme for high-value customers. 100% off on making charges.',
        features: ['Zero making charges', 'Extra 2% bonus', 'Dedicated relationship manager', 'Home delivery', 'Exclusive designs'],
        popular: false
    }
];

module.exports = SCHEME_PLANS;
