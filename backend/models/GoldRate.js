const mongoose = require('mongoose');
const { fetchLiveMetalRates } = require('../services/liveMetalRates');

const goldRateSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Date is required'],
        unique: true
    },
    gold24K: {
        type: Number,
        required: [true, '24K gold rate is required'],
        min: [1, 'Rate must be positive']
    },
    gold22K: {
        type: Number,
        required: [true, '22K gold rate is required'],
        min: [1, 'Rate must be positive']
    },
    gold18K: {
        type: Number,
        required: [true, '18K gold rate is required'],
        min: [1, 'Rate must be positive']
    },
    silver: {
        type: Number,
        required: [true, 'Silver rate is required'],
        min: [1, 'Rate must be positive']
    },
    platinum: {
        type: Number,
        default: 0
    },
    previousGold24K: Number,
    previousGold22K: Number,
    previousSilver: Number,
    change24K: {
        type: Number,
        default: 0
    },
    change22K: {
        type: Number,
        default: 0
    },
    changePercentage24K: {
        type: Number,
        default: 0
    },
    changePercentage22K: {
        type: Number,
        default: 0
    },
    source: {
        type: String,
        default: 'manual'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: String
}, {
    timestamps: true
});

// Calculate changes before saving
goldRateSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('gold22K') || this.isModified('gold24K')) {
        // Get previous rate
        const previousRate = await mongoose.model('GoldRate')
            .findOne({ date: { $lt: this.date } })
            .sort({ date: -1 });
        
        if (previousRate) {
            this.previousGold24K = previousRate.gold24K;
            this.previousGold22K = previousRate.gold22K;
            this.previousSilver = previousRate.silver;
            
            this.change24K = this.gold24K - previousRate.gold24K;
            this.change22K = this.gold22K - previousRate.gold22K;
            
            this.changePercentage24K = ((this.change24K / previousRate.gold24K) * 100).toFixed(2);
            this.changePercentage22K = ((this.change22K / previousRate.gold22K) * 100).toFixed(2);
        }
    }
    next();
});

// Static method to get current rate
goldRateSchema.statics.getCurrentRate = async function() {
    const manualRate = await this.findOne({ isActive: true }).sort({ date: -1 });

    if (process.env.USE_LIVE_METAL_RATES === 'false') {
        return manualRate;
    }

    try {
        const liveRate = await fetchLiveMetalRates();
        return {
            ...(manualRate ? manualRate.toObject() : {}),
            ...liveRate,
            _id: manualRate?._id,
            previousGold24K: manualRate?.previousGold24K,
            previousGold22K: manualRate?.previousGold22K,
            previousSilver: manualRate?.previousSilver,
            change24K: manualRate?.change24K || 0,
            change22K: manualRate?.change22K || 0,
            changePercentage24K: manualRate?.changePercentage24K || 0,
            changePercentage22K: manualRate?.changePercentage22K || 0,
        };
    } catch (error) {
        return manualRate;
    }
};

// Static method to get rate history
goldRateSchema.statics.getHistory = async function(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await this.find({ date: { $gte: startDate } })
        .sort({ date: -1 })
        .select('date gold22K gold24K silver change22K changePercentage22K');
};

// Static method to get rate for specific date
goldRateSchema.statics.getRateForDate = async function(date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Try to get exact date
    let rate = await this.findOne({ 
        date: {
            $gte: targetDate,
            $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
    });
    
    // If not found, get the closest previous date
    if (!rate) {
        rate = await this.findOne({ date: { $lte: targetDate } }).sort({ date: -1 });
    }
    
    return rate;
};

module.exports = mongoose.model('GoldRate', goldRateSchema);
