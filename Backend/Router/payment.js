const express = require('express');
const router = new express.Router();
const auth = require('../Authentication/auth');
const Payment = require('../Model/payment');
const players = require('../Model/players');
const { createAuditLog } = require('../Utils/audit');
const { sendPaymentSuccessEmail } = require('../Utils/email');

// 1. Add Payment
router.post('/payments/add', auth, auth.allowRoles('superadmin', 'admin', 'accountant'), async (req, res) => {
    try {
        const { playerId, amount, paymentMethod, transactionId, paymentDate } = req.body;

        if (!playerId || !amount || !paymentMethod || !paymentDate) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        const payAmount = parseFloat(amount);
        if (isNaN(payAmount) || payAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
        }

        // Find the player
        const filter = req.userRole === 'superadmin' ? { playerId } : { playerId, owner: req.currentEmp._id };
        const playerDoc = await players.findOne(filter);
        if (!playerDoc) {
            return res.status(404).json({ success: false, message: 'Player not found' });
        }

        const total = parseFloat(playerDoc.totalFee) || 0;
        const currentPaid = parseFloat(playerDoc.payingFee) || 0;
        const newPaid = currentPaid + payAmount;

        if (newPaid > total) {
            return res.status(400).json({
                success: false,
                message: `Payment exceeds total fee. Max outstanding is ₹${total - currentPaid}`
            });
        }

        const newPending = total - newPaid;

        // Update player
        playerDoc.payingFee = String(newPaid);
        playerDoc.pendingFee = String(newPending);
        await playerDoc.save();

        // Create payment record
        const paymentRecord = new Payment({
            playerId,
            playerName: playerDoc.fullName,
            paymentDate,
            amount: String(payAmount),
            paymentMethod,
            transactionId: transactionId || '',
            owner: req.currentEmp._id
        });
        await paymentRecord.save();

        // Audit Log
        createAuditLog({
            actor: req.currentEmp._id,
            action: 'create',
            collectionName: 'payments',
            recordId: paymentRecord._id.toString(),
            message: `Recorded payment of ₹${payAmount} for player ${playerDoc.fullName}`,
            metadata: { playerId, amount: payAmount, transactionId }
        });

        // Send Email Receipt
        if (playerDoc.email) {
            await sendPaymentSuccessEmail(playerDoc.email, playerDoc.fullName, payAmount, transactionId);
        }

        res.status(200).json({
            success: true,
            message: 'Payment recorded successfully',
            data: paymentRecord
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to record payment', error: e.message });
    }
});

// 2. Fetch payments report
router.get('/payments/report', auth, async (req, res) => {
    try {
        const filter = ['superadmin', 'coach', 'accountant'].includes(req.userRole) ? {} : { owner: req.currentEmp._id };
        const paymentsList = await Payment.find(filter).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: 'Payments fetched successfully',
            data: paymentsList
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to fetch payments', error: e.message });
    }
});

module.exports = router;
