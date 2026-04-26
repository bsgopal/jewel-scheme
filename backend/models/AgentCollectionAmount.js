const mongoose = require('mongoose');

const AgentCollectionAmountSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amounts: [{
      id: {
        type: String,
        default: () => new Date().getTime().toString()
      },
      value: {
        type: Number,
        required: true,
        min: 100,
        max: 100000
      },
      label: {
        type: String,
        default: null
      },
      isActive: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    defaultAmount: {
      type: Number,
      default: null
    },
    totalCollections: {
      type: Number,
      default: 0
    },
    lastUsedAmount: {
      type: Number,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for efficient queries
AgentCollectionAmountSchema.index({ agent: 1, 'amounts.isActive': 1 });

module.exports = mongoose.model('AgentCollectionAmount', AgentCollectionAmountSchema);
