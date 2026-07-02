const express = require('express');
const router = new express.Router();
const Login = require('../Model/login');
const PasswordReset = require('../Model/passwordReset');
const { sendOTPEmail } = require('../Utils/email');
const validator = require('validator');
const bcrypt = require('bcrypt');

// 1. Send OTP
router.post('/auth/forgot-password', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    try {
        const user = await Login.findOne({ email });
        if (!user) {
            // Avoid email harvesting by returning success but saying code sent if email exists
            return res.status(200).json({ success: true, message: 'If email exists, verification code sent.' });
        }

        // Generate 6 digit numeric OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Remove older OTPs for same email
        await PasswordReset.deleteMany({ email });

        const resetDoc = new PasswordReset({ email, otp, expiresAt });
        await resetDoc.save();

        await sendOTPEmail(email, otp);

        res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to request reset', error: e.message });
    }
});

// 2. Verify OTP
router.post('/auth/verify-otp', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        const resetRecord = await PasswordReset.findOne({ email, otp });
        if (!resetRecord) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (resetRecord.expiresAt < new Date()) {
            await PasswordReset.deleteOne({ _id: resetRecord._id });
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        resetRecord.verified = true;
        await resetRecord.save();

        res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Verification failed', error: e.message });
    }
});

// 3. Reset Password
router.post('/auth/reset-password', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const newPassword = String(req.body.password || '');

    if (!email || !newPassword || newPassword.length < 4) {
        return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }

    try {
        const resetRecord = await PasswordReset.findOne({ email, verified: true });
        if (!resetRecord) {
            return res.status(400).json({ success: false, message: 'OTP verification required first' });
        }

        const user = await Login.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        // Delete verification record
        await PasswordReset.deleteMany({ email });

        res.status(200).json({ success: true, message: 'Password reset successfully.' });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to reset password', error: e.message });
    }
});

module.exports = router;
