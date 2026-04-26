// models/NewArrival.js

const mongoose = require('mongoose');

const newArrivalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    offer: {
      type: String,
      trim: true,
      default: null,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('NewArrival', newArrivalSchema);