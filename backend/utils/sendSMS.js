/**
 * SMS utility — currently unused.
 * OTP delivery has been migrated to email (sendEmail.js).
 * This file is preserved for future use if SMS is re-enabled.
 */

const sendSMS = async (phone, message) => {
    // SMS gateway implementation
    return { success: true };
};

module.exports = { sendSMS };
