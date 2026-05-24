/**
 * Migration: Fix Silver Rates - Divide by 1000
 * 
 * This migration fixes all existing silver rates in the database by dividing them by 1000.
 * The backend was returning silver rates that were 1000x larger than expected.
 * 
 * Usage: node migrations/fix-silver-rates.js
 */

const mongoose = require('mongoose');
const GoldRate = require('../models/GoldRate');

async function fixSilverRates() {
  try {
    console.log('[Migration] Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jewel-scheme');
    
    console.log('[Migration] Fetching all gold rates...');
    const allRates = await GoldRate.find({});
    
    if (allRates.length === 0) {
      console.log('[Migration] No rates found in database. Nothing to fix.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`[Migration] Found ${allRates.length} rates to fix.`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const rate of allRates) {
      // Check if silver rate is already fixed (less than 1000)
      if (rate.silver < 1000) {
        console.log(`[Migration] Rate ${rate.date.toISOString()}: Silver ${rate.silver} already fixed (skipping)`);
        skippedCount++;
        continue;
      }
      
      // Fix the silver rate by dividing by 1000
      const oldSilver = rate.silver;
      rate.silver = Math.round((rate.silver / 1000) * 100) / 100;
      
      await rate.save();
      console.log(`[Migration] Rate ${rate.date.toISOString()}: Fixed silver from ${oldSilver} to ${rate.silver}`);
      fixedCount++;
    }
    
    console.log(`[Migration] Migration complete!`);
    console.log(`[Migration] Fixed: ${fixedCount} rates`);
    console.log(`[Migration] Skipped: ${skippedCount} rates (already fixed)`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('[Migration] Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixSilverRates();
