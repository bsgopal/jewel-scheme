// Generate random string
exports.generateRandomString = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Format currency
exports.formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

// Format date
exports.formatDate = (date, format = 'short') => {
    const options = format === 'long' 
        ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        : { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-IN', options);
};

// Calculate gold weight
exports.calculateGoldWeight = (amount, goldRate) => {
    return parseFloat((amount / goldRate).toFixed(4));
};

// Calculate days between dates
exports.daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
};

// Paginate results
exports.paginate = (page = 1, limit = 20) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    return { skip, limit: limitNum, page: pageNum };
};