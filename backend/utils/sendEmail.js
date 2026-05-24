const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

/**
 * Send OTP via Email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} purpose - 'verification' | 'password-reset' | 'general'
 */
const sendOTPEmail = async (email, otp, purpose = 'verification') => {
    const transporter = createTransporter();
    const appName = process.env.APP_NAME || 'JewelScheme';

    const config = {
        'verification': {
            subject: `${appName} - Email Verification OTP`,
            heading: 'Verify Your Email Address',
            message: 'Thank you for registering with JewelScheme. Please use the OTP below to verify your email address.'
        },
        'password-reset': {
            subject: `${appName} - Password Reset OTP`,
            heading: 'Reset Your Password',
            message: 'We received a request to reset your password. Use the OTP below to proceed.'
        },
        'general': {
            subject: `${appName} - Your OTP Code`,
            heading: 'Your One-Time Password',
            message: 'Use the OTP below to complete your action.'
        }
    };

    const { subject, heading, message } = config[purpose] || config['general'];

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .wrap { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #c9a84c, #f0d080); padding: 30px; text-align: center; }
        .header h1 { color: #3d2b00; margin: 0; font-size: 22px; }
        .body { padding: 30px; }
        .body p { color: #555; font-size: 15px; line-height: 1.6; }
        .otp-box { background: #fff8e7; border: 2px dashed #c9a84c; border-radius: 8px; text-align: center; padding: 20px; margin: 25px 0; }
        .otp-code { font-size: 38px; font-weight: bold; color: #c9a84c; letter-spacing: 10px; }
        .otp-note { font-size: 13px; color: #888; margin-top: 8px; }
        .footer { background: #f9f9f9; padding: 18px; text-align: center; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="header"><h1>💎 ${appName}</h1></div>
        <div class="body">
          <h2 style="color:#3d2b00;">${heading}</h2>
          <p>${message}</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-note">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</div>
          </div>
          <p>If you did not request this, please ignore this email or contact our support team.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.<br/>
          This is an automated email. Please do not reply.
        </div>
      </div>
    </body>
    </html>`;

    const info = await transporter.sendMail({
        from: `"${appName}" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject,
        html
    });

    return { success: true, messageId: info.messageId };
};

/**
 * Send a general email
 */
const sendEmail = async (email, subject, html) => {
    const transporter = createTransporter();
    const appName = process.env.APP_NAME || 'JewelScheme';

    const info = await transporter.sendMail({
        from: `"${appName}" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject,
        html
    });

    return { success: true, messageId: info.messageId };
};

module.exports = { sendOTPEmail, sendEmail };
