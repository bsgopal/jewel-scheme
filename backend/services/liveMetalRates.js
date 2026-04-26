const https = require('https');

const TROY_OUNCE_GRAMS = 31.1034768;
const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedRate = null;
let cachedAt = 0;

const getJson = (url) => new Promise((resolve, reject) => {
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
                resolve(JSON.parse(body));
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

const getUsdInrRate = async () => {
    const data = await getJson('https://open.er-api.com/v6/latest/USD');
    const inr = data?.rates?.INR;

    if (!inr || Number(inr) <= 0) {
        throw new Error('USD-INR rate unavailable');
    }

    return Number(inr);
};

const fetchLiveMetalRates = async () => {
    if (cachedRate && Date.now() - cachedAt < CACHE_TTL_MS) {
        return cachedRate;
    }

    const [gold, silver, usdInr] = await Promise.all([
        getJson('https://api.gold-api.com/price/XAU'),
        getJson('https://api.gold-api.com/price/XAG'),
        getUsdInrRate(),
    ]);

    const gold24K = roundRate((Number(gold.price) * usdInr) / TROY_OUNCE_GRAMS);
    const silverRate = roundRate((Number(silver.price) * usdInr) / TROY_OUNCE_GRAMS);

    if (!gold24K || !silverRate) {
        throw new Error('Live metal prices unavailable');
    }

    cachedRate = {
        date: new Date(gold.updatedAt || Date.now()),
        gold24K,
        gold22K: roundRate(gold24K * (22 / 24)),
        gold18K: roundRate(gold24K * (18 / 24)),
        silver: silverRate,
        platinum: 0,
        source: 'gold-api.com',
        live: true,
        providerUpdatedAt: gold.updatedAt || null,
        silverProviderUpdatedAt: silver.updatedAt || null,
        currency: 'INR',
        unit: 'gram',
        usdInr,
        isActive: true,
    };
    cachedAt = Date.now();

    return cachedRate;
};

module.exports = {
    fetchLiveMetalRates,
};
