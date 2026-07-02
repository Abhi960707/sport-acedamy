let nodemailer = null;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    console.warn('⚠️ nodemailer package not installed. Running email service in local mock log mode.');
}

const createTransporter = () => {
    if (!nodemailer) return null;

    const host = process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const port = parseInt(process.env.SMTP_PORT || '2525', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn('⚠️ SMTP_USER or SMTP_PASS not set. Email service is running in Fallback Log Mode.');
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        auth: { user, pass }
    });
};

const sendMail = async ({ to, subject, html, text }) => {
    const transporter = createTransporter();
    if (!transporter) {
        console.log(`[EMAIL FALLBACK LOGGER]
To: ${to}
Subject: ${subject}
Content: ${text || html}
======================================`);
        return true;
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Sport Academy" <noreply@sportacademy.com>',
            to,
            subject,
            text,
            html
        });
        return true;
    } catch (error) {
        console.error('Nodemailer failed to send email:', error);
        return false;
    }
};

const sendWelcomeEmail = async (userEmail, userName) => {
    return sendMail({
        to: userEmail,
        subject: 'Welcome to Sport Academy!',
        text: `Hello ${userName},\n\nWelcome to Sport Academy Management System! Your account is created successfully.`,
        html: `<h3>Hello ${userName},</h3><p>Welcome to <strong>Sport Academy Management System</strong>! Your account has been created successfully.</p>`
    });
};

const sendPaymentSuccessEmail = async (userEmail, playerName, amount, txId) => {
    return sendMail({
        to: userEmail,
        subject: 'Payment Receipt - Sport Academy',
        text: `Hello,\n\nWe successfully received a payment of ₹${amount} for player ${playerName}. Transaction ID: ${txId || 'N/A'}. Thank you!`,
        html: `<h3>Payment Success</h3><p>Hello,</p><p>We successfully received a payment of <strong>₹${amount}</strong> for player <strong>${playerName}</strong>.</p><p>Transaction ID: ${txId || 'N/A'}.</p><p>Thank you for choosing Sport Academy!</p>`
    });
};

const sendFeeReminderEmail = async (userEmail, playerName, pendingAmount) => {
    return sendMail({
        to: userEmail,
        subject: 'Fee Payment Reminder - Sport Academy',
        text: `Hello,\n\nThis is a friendly reminder that a pending fee of ₹${pendingAmount} is outstanding for player ${playerName}. Please pay at your earliest convenience.`,
        html: `<h3>Fee Payment Reminder</h3><p>Hello,</p><p>This is a friendly reminder that a pending fee of <strong>₹${pendingAmount}</strong> is outstanding for player <strong>${playerName}</strong>.</p><p>Please pay at your earliest convenience.</p>`
    });
};

const sendOTPEmail = async (userEmail, otp) => {
    return sendMail({
        to: userEmail,
        subject: 'Reset Password Verification Code',
        text: `Your OTP to reset password is: ${otp}. It is valid for 10 minutes.`,
        html: `<h3>Reset Password Verification</h3><p>Your OTP to reset password is: <strong>${otp}</strong>.</p><p>This code is valid for 10 minutes. Please do not share it with anyone.</p>`
    });
};

module.exports = {
    sendWelcomeEmail,
    sendPaymentSuccessEmail,
    sendFeeReminderEmail,
    sendOTPEmail
};
