const express = require('express');
const router = new express.Router();
const auth = require('../Authentication/auth');
const players = require('../Model/players');
const coach = require('../Model/coach');
const Notification = require('../Model/notification');

router.get('/notifications', auth, async (req, res) => {
    try {
        const filter = ['superadmin', 'coach', 'accountant'].includes(req.userRole) ? {} : { owner: req.currentEmp._id };

        // 1. Get manual/saved notifications
        const savedNotifications = await Notification.find({ owner: req.currentEmp._id }).sort({ createdAt: -1 });

        // Extract dismissed dynamic notifications
        const dismissedDynamicIds = savedNotifications
            .filter(n => n.isRead && (n.title.startsWith('fee-') || n.title.startsWith('reg-') || n.title.startsWith('coach-')))
            .map(n => n.title);

        // 2. Generate dynamic notifications
        const activePlayers = await players.find(filter);
        const activeCoaches = await coach.find(filter);

        const dynamicAlerts = [];

        // Dynamic Pending Fee Reminders
        activePlayers.forEach(p => {
            const pendingVal = parseFloat(p.pendingFee) || 0;
            const notifId = `fee-${p._id}`;
            if (pendingVal > 0 && !dismissedDynamicIds.includes(notifId)) {
                dynamicAlerts.push({
                    _id: notifId,
                    title: 'Pending Fee Reminder',
                    message: `Player ${p.fullName} has a pending balance of ₹${p.pendingFee}.`,
                    type: 'fee_reminder',
                    isRead: false,
                    createdAt: p.updatedAt || new Date()
                });
            }
        });

        // Dynamic New Registrations (e.g. joined within 10 days)
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        activePlayers.forEach(p => {
            const joinDate = new Date(p.joiningDate);
            const notifId = `reg-${p._id}`;
            if (!isNaN(joinDate.getTime()) && joinDate >= tenDaysAgo && !dismissedDynamicIds.includes(notifId)) {
                dynamicAlerts.push({
                    _id: notifId,
                    title: 'New Player Registration',
                    message: `${p.fullName} has registered for ${p.sportChosen}.`,
                    type: 'registration',
                    isRead: false,
                    createdAt: joinDate
                });
            }
        });

        // Dynamic New Coaches
        activeCoaches.forEach(c => {
            // If coach has joiningDate (e.g. within 10 days)
            if (c.joiningDate) {
                const joinDate = new Date(c.joiningDate);
                const notifId = `coach-${c._id}`;
                if (!isNaN(joinDate.getTime()) && joinDate >= tenDaysAgo && !dismissedDynamicIds.includes(notifId)) {
                    dynamicAlerts.push({
                        _id: notifId,
                        title: 'New Coach Onboarded',
                        message: `Coach ${c.name} has joined specialized in ${c.sportSpecialization}.`,
                        type: 'coach',
                        isRead: false,
                        createdAt: joinDate
                    });
                }
            }
        });

        // Combine and sort by date descending (filter out the placeholder dismissed records from display)
        const displaySaved = savedNotifications.filter(n => !(n.title.startsWith('fee-') || n.title.startsWith('reg-') || n.title.startsWith('coach-')));
        const allAlerts = [...displaySaved, ...dynamicAlerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            success: true,
            data: allAlerts
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: e.message });
    }
});

// Mark as read (saved notifications only)
router.post('/notifications/read/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        if (id.startsWith('fee-') || id.startsWith('reg-') || id.startsWith('coach-')) {
            // Save a placeholder notification to remember it was dismissed
            const exists = await Notification.findOne({ title: id, owner: req.currentEmp._id });
            if (!exists) {
                await Notification.create({
                    title: id,
                    message: 'Dismissed',
                    type: 'other',
                    isRead: true,
                    owner: req.currentEmp._id
                });
            }
            return res.status(200).json({ success: true, message: 'Dynamic notification read' });
        }

        const notif = await Notification.findOneAndUpdate(
            { _id: id, owner: req.currentEmp._id },
            { isRead: true },
            { new: true }
        );
        res.status(200).json({ success: true, data: notif });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to mark read', error: e.message });
    }
});

module.exports = router;
