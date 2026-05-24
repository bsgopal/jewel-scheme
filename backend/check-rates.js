const mongoose = require('mongoose');
const GoldRate = require('./models/GoldRate');

async function checkRates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jewel-scheme');
    const rate = await GoldRate.findOne({ isActive: true }).sort({ date: -1 });
    if (rate) {
      console.log('Current stored rate:');
      console.log('Silver:', rate.silver);
      console.log('Gold 24K:', rate.gold24K);
      console.log('Gold 22K:', rate.gold22K);
      console.log('Gold 18K:', rate.gold18K);
      console.log('Source:', rate.source);
      console.log('Date:', rate.date);
    } else {
      console.log('No rates found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkRates();
