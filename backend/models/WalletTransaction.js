const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit', 'convert', 'wallet_payment', 'adjustment'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    goldWeight: {
        type: Number,
        default: 0
    },
    balanceAfter: {
        cash: { type: Number, default: 0 },
        gold: { type: Number, default: 0 }
    },
    remarks: {
        type: String,
        default: ''
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
