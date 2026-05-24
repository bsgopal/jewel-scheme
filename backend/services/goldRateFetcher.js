const https = require('https');
const GoldRate = require('../models/GoldRate');

const GOLD_RATE_PROVIDER = process.env.GOLD_RATE_PROVIDER || 'metalpriceapi';
const METAL_API_KEY = process.env.METAL_API_KEY;
const METAL_API_URL = process.env.METAL_API_URL || 'https://api.metalpriceapi.com/v1/latest';
const COMMODITIES_API_KEY = process.env.COMMODITIES_API_KEY;
const COMMODITIES_API_URL = process.env.COMMODITIES_API_URL || 'https://commodities-api.com/api/convert';
const COMMODITIES_24K_SYMBOL = process.env.COMMODITIES_24K_SYMBOL || 'BANG-24k';
const COMMODITIES_22K_SYMBOL = process.env.COMMODITIES_22K_SYMBOL || 'BANG-22k';
const COMMODITIES_18K_SYMBOL = process.env.COMMODITIES_18K_SYMBOL || 'BANG-18K';
const COMMODITIES_SILVER_SYMBOL = process.env.COMMODITIES_SILVER_SYMBOL || 'XAG-BANG';
const GRAMS_PER_TROY_OUNCE = 31.1034768;
const DEFAULT_FRESHNESS_MS = 60 * 60 * 1000;
const INDIA_RETAIL_PREMIUM = Number(process.env.GOLD_RATE_PREMIUM_MULTIPLIER || 1);

const requestJson = (url) => new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 8000 }, (response) => {
        let body = '';

        response.on('data', (chunk) => {
            body += chunk;
        });

        response.on('end', () => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error(`Request failed with status ${response.statusCode}`));
            }

            try {
                const data = JSON.parse(body);
                if (data?.success === false) {
                    return reject(new Error(data?.error?.info || 'Metal API request failed'));
                }

                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    });

    request.on('timeout', () => {
        request.destroy(new Error('Request timed out'));
    });

    request.on('error', reject);
});

const roundRate = (value) => Math.round(Number(value) * 100) / 100;

const getLatestStoredRate = async () => GoldRate.findOne({ isActive: true }).sort({ date: -1, updatedAt: -1 });

const getStartOfIstDay = (date = new Date()) => {
    const istString = date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const istDate = new Date(istString);
    istDate.setHours(0, 0, 0, 0);

    const localString = istDate.toLocaleString('en-US');
    return new Date(localString);
};

const getFreshnessWindowMs = () => {
    const value = Number(process.env.GOLD_RATE_FRESHNESS_MINUTES || 60);
    return Number.isFinite(value) && value > 0 ? value * 60 * 1000 : DEFAULT_FRESHNESS_MS;
};

const buildLatestUrl = (base, currencies) => {
    const url = new URL(METAL_API_URL);
    url.searchParams.set('api_key', METAL_API_KEY);
    url.searchParams.set('base', base);
    url.searchParams.set('currencies', currencies);
    return url.toString();
};

const buildCommoditiesConvertUrl = (fromSymbol, toSymbol = 'INR', amount = 1) => {
    const url = new URL(COMMODITIES_API_URL);
    url.searchParams.set('access_key', COMMODITIES_API_KEY);
    url.searchParams.set('from', fromSymbol);
    url.searchParams.set('to', toSymbol);
    url.searchParams.set('amount', String(amount));
    return url.toString();
};

const getRateValue = (payload, currencyCode) => {
    const directValue = payload?.rates?.[currencyCode];
    if (Number.isFinite(Number(directValue)) && Number(directValue) > 0) {
        return Number(directValue);
    }

    const pairValue = payload?.rates?.[`${payload?.base || ''}${currencyCode}`];
    if (Number.isFinite(Number(pairValue)) && Number(pairValue) > 0) {
        return Number(pairValue);
    }

    return null;
};

const fetchMetalRatesFromApi = async () => {
    if (!METAL_API_KEY || METAL_API_KEY === 'your_api_key' || METAL_API_KEY === 'your_metalpriceapi_key') {
        throw new Error('METAL_API_KEY is not configured. Please set METAL_API_KEY in .env file');
    }

    const [goldResponse, silverResponse] = await Promise.all([
        requestJson(buildLatestUrl('XAU', 'INR')),
        requestJson(buildLatestUrl('XAG', 'INR'))
    ]);

    const goldInrPerTroyOunce = getRateValue(goldResponse, 'INR');
    const silverInrPerTroyOunce = getRateValue(silverResponse, 'INR');

    if (!goldInrPerTroyOunce || !silverInrPerTroyOunce) {
        throw new Error('Invalid metal API response');
    }

    const gold24K = roundRate((goldInrPerTroyOunce / GRAMS_PER_TROY_OUNCE) * INDIA_RETAIL_PREMIUM);
    const silver = roundRate(silverInrPerTroyOunce / GRAMS_PER_TROY_OUNCE);

    if (!gold24K || !silver) {
        throw new Error('Calculated gold or silver rate is invalid');
    }

    return {
        gold24K,
        gold22K: roundRate(gold24K * 0.916),
        gold18K: roundRate(gold24K * 0.75),
        silver,
        source: 'metalpriceapi',
        providerUpdatedAt: new Date(goldResponse?.timestamp ? goldResponse.timestamp * 1000 : Date.now()),
        fetchedAt: new Date()
    };
};

const getCommoditiesResult = async (symbol) => {
    const response = await requestJson(buildCommoditiesConvertUrl(symbol, 'INR', 1));
    const result = Number(response?.result);

    if (!Number.isFinite(result) || result <= 0) {
        throw new Error(`Invalid commodities-api result for ${symbol}`);
    }

    return {
        price: roundRate(result),
        providerUpdatedAt: new Date(response?.info?.timestamp ? response.info.timestamp * 1000 : Date.now()),
    };
};

const fetchCommoditiesRatesFromApi = async () => {
    if (!COMMODITIES_API_KEY || COMMODITIES_API_KEY === 'your_commodities_api_key') {
        throw new Error('COMMODITIES_API_KEY is not configured');
    }

    const [gold24K, gold22K, gold18K, silver] = await Promise.all([
        getCommoditiesResult(COMMODITIES_24K_SYMBOL),
        getCommoditiesResult(COMMODITIES_22K_SYMBOL),
        getCommoditiesResult(COMMODITIES_18K_SYMBOL),
        getCommoditiesResult(COMMODITIES_SILVER_SYMBOL)
    ]);

    return {
        gold24K: gold24K.price,
        gold22K: gold22K.price,
        gold18K: gold18K.price,
        silver: silver.price,
        source: 'commodities-api',
        providerUpdatedAt: gold22K.providerUpdatedAt,
        fetchedAt: new Date()
    };
};

const fetchLiveRateFromProvider = async () => {
    switch (String(GOLD_RATE_PROVIDER).toLowerCase()) {
        case 'commodities-api':
        case 'commodities_api':
            return fetchCommoditiesRatesFromApi();
        case 'metalpriceapi':
        default:
            return fetchMetalRatesFromApi();
    }
};

const isRateFresh = (rate) => {
    if (!rate?.updatedAt) {
        return false;
    }

    return new Date(rate.updatedAt).getTime() > Date.now() - getFreshnessWindowMs();
};

const getRateForPurity = (rate, purity = '22K') => {
    if (!rate) {
        return null;
    }

    switch (String(purity).toUpperCase()) {
        case '24K':
            return rate.gold24K;
        case '18K':
            return rate.gold18K;
        default:
            return rate.gold22K;
    }
};

const fetchAndStoreLiveRate = async () => {
    try {
        const liveRate = await fetchLiveRateFromProvider();
        const today = getStartOfIstDay();

        const existingRate = await GoldRate.findOne({
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        const rateData = {
            date: today,
            gold24K: liveRate.gold24K,
            gold22K: liveRate.gold22K,
            gold18K: liveRate.gold18K,
            silver: liveRate.silver,
            platinum: existingRate?.platinum || 0,
            source: liveRate.source,
            providerUpdatedAt: liveRate.providerUpdatedAt,
            fetchedAt: liveRate.fetchedAt,
            isActive: true,
            notes: `Live refresh at ${liveRate.fetchedAt.toISOString()}`
        };

        if (existingRate) {
            existingRate.set(rateData);
            return existingRate.save();
        }

        return GoldRate.create(rateData);
    } catch (error) {
        // Failed to fetch live gold rates
        return null;
    }
};

const getCurrentRateWithRefresh = async () => {
    try {
        const currentRate = await getLatestStoredRate();

        if (process.env.USE_LIVE_METAL_RATES === 'false') {
            return currentRate;
        }

        if (!currentRate || !isRateFresh(currentRate)) {
            const refreshedRate = await fetchAndStoreLiveRate();
            return refreshedRate || currentRate;
        }

        return currentRate;
    } catch (error) {
        // Error getting current rate
        return null;
    }
};

module.exports = {
    fetchAndStoreLiveRate,
    getCurrentRateWithRefresh,
    getLatestStoredRate,
    getRateForPurity,
    isRateFresh
};
