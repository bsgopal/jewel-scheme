const cron = require('node-cron');
const notificationService = require('./notificationService');

/**
 * Initialize payment reminder cron job
 * Runs every hour to check for upcoming and overdue payments
 */
function initPaymentReminderCron() {
    // Run every hour at the top of the hour
    const job = cron.schedule('0 * * * *', async () => {
        console.log(`[${new Date().toISOString()}] Running payment reminder check...`);
        try {
            await notificationService.checkAndSendPaymentReminders();
        } catch (error) {
            console.error('Error in payment reminder cron job:', error);
        }
    });

    console.log('Payment reminder cron job initialized (runs every hour)');
    return job;
}

/**
 * Initialize immediate payment check on server start
 * Useful for catching any missed reminders
 */
async function runImmediatePaymentCheck() {
    console.log('Running immediate payment check on server start...');
    try {
        await notificationService.checkAndSendPaymentReminders();
    } catch (error) {
        console.error('Error in immediate payment check:', error);
    }
}

module.exports = {
    initPaymentReminderCron,
    runImmediatePaymentCheck
};
