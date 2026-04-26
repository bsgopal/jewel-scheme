const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    branchCode: {
        type: String,
        unique: true,
        sparse: true
    },
    branchName: {
        type: String,
        required: [true, 'Branch name is required'],
        trim: true
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, default: 'Tamil Nadu' },
        pincode: { type: String, required: true },
        landmark: String
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    alternatePhone: String,
    email: {
        type: String,
        lowercase: true
    },
    manager: {
        name: String,
        phone: String,
        email: String
    },
    workingHours: {
        weekdays: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    gstNumber: String,
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    facilities: [{
        type: String,
        enum: ['Parking', 'AC', 'Locker', 'Repair', 'Customization', 'Exchange']
    }],
    images: [String]
}, {
    timestamps: true
});

// Generate Branch Code before validation
branchSchema.pre('validate', async function(next) {
    if (this.isNew && !this.branchCode) {
        const city = this.address && this.address.city 
            ? this.address.city.substring(0, 3).toUpperCase() 
            : 'BRN';
        const count = await mongoose.model('Branch').countDocuments();
        this.branchCode = `${city}${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Branch', branchSchema);