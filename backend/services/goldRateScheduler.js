const { fetchAndStoreLiveRate } = require('./goldRateFetcher');

let schedulerHandle = null;

const getIstHour = (date = new Date()) => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'Asia/Kolkata'
    });

    return Number(formatter.format(date));
};

const shouldRefreshNow = () => {
    const hour = getIstHour();
    return hour >= 9 && hour <= 23;
};

const initializeGoldRateScheduler = () => {
    if (schedulerHandle || process.env.USE_LIVE_METAL_RATES === 'false') {
        return;
    }

    fetchAndStoreLiveRate().catch((error) => {
        console.error('Initial gold rate refresh failed:', error.message);
    });

    schedulerHandle = setInterval(() => {
        if (!shouldRefreshNow()) {
            return;
        }

        fetchAndStoreLiveRate().catch((error) => {
            console.error('Scheduled gold rate refresh failed:', error.message);
        });
    }, 60 * 60 * 1000);

    if (typeof schedulerHandle.unref === 'function') {
        schedulerHandle.unref();
    }

    console.log('Gold rate scheduler initialized');
};

module.exports = {
    initializeGoldRateScheduler
};
