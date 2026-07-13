const express = require('express');
const router = new express.Router();
const auth = require('../Authentication/auth');
const Settings = require('../Model/settings');

// 1. Get Settings
router.get('/settings', auth, async (req, res) => {
    try {
        let currentSettings = await Settings.findOne({ owner: req.academyOwnerId });
        if (!currentSettings) {
            currentSettings = new Settings({ owner: req.academyOwnerId });
            await currentSettings.save();
        }
        res.status(200).json({ success: true, data: currentSettings });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to retrieve settings', error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message });
    }
});

// 2. Update Settings
router.put('/settings', auth, auth.allowRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const { academyName, logo, currency, timeZone, session } = req.body;
        let currentSettings = await Settings.findOne({ owner: req.academyOwnerId });

        if (!currentSettings) {
            currentSettings = new Settings({ owner: req.academyOwnerId });
        }

        if (academyName !== undefined) currentSettings.academyName = academyName;
        if (logo !== undefined) currentSettings.logo = logo;
        if (currency !== undefined) currentSettings.currency = currency;
        if (timeZone !== undefined) currentSettings.timeZone = timeZone;
        if (session !== undefined) currentSettings.session = session;

        await currentSettings.save();
        res.status(200).json({ success: true, message: 'Settings updated successfully', data: currentSettings });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to update settings', error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message });
    }
});

module.exports = router;
