/**
 * SMS utility — currently unused.
 * OTP delivery has been migrated to email (sendEmail.js).
 * This file is preserved for future use if SMS is re-enabled.
 */

const sendSMS = async (phone, message) => {
    // Implement Twilio or any SMS gateway here if needed
    console.log(`[SMS stub] To: ${phone} | Message: ${message}`);
    return { success: true };
};

module.exports = { sendSMS };
