const express = require('express');
const router = new express.Router();
const auth = require('../Authentication/auth');
const players = require('../Model/players');
const Attendance = require('../Model/attendance');
const Payment = require('../Model/payment');
const PlayerArchive = require('../Model/playerArchive');
const PrintHistory = require('../Model/printHistory');
const { createAuditLog } = require('../Utils/audit');

function calculateExperience(joinDateStr, endDateStr) {
    if (!joinDateStr) return { months: 0, str: '0 Months' };
    const join = new Date(joinDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date();
    if (isNaN(join.getTime()) || isNaN(end.getTime())) {
        return { months: 0, str: '0 Months' };
    }
    let years = end.getFullYear() - join.getFullYear();
    let months = end.getMonth() - join.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    const totalMonths = (years * 12) + months;
    
    let str = '';
    if (years > 0) {
        str += `${years} Year${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
        if (str) str += ' ';
        str += `${months} Month${months > 1 ? 's' : ''}`;
    }
    if (!str) str = 'Less than a month';
    return { months: totalMonths, str };
}

// 1. Get Player Summary (Attendance, Payments, Experience, Print History)
router.get('/players/summary/:id', auth, async (req, res) => {
    try {
        const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.academyOwnerId };
        const player = await players.findOne(filter);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

        // 1.1 Attendance summary
        const atts = await Attendance.find({ playerId: player._id.toString() }).lean();
        const totalAtt = atts.length;
        const presentAtt = atts.filter(a => a.status.toLowerCase() === 'present').length;
        const absentAtt = atts.filter(a => a.status.toLowerCase() === 'absent').length;
        const percentageAtt = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;
        const lastAtt = atts.length > 0 ? atts.sort((a,b) => new Date(b.attendanceDate) - new Date(a.attendanceDate))[0].attendanceDate : '—';

        // 1.2 Payments summary
        const pmts = await Payment.find({ playerId: player.playerId }).lean().sort({ paymentDate: -1 });
        const totalFee = parseFloat(player.totalFee) || 0;
        const paidFee = parseFloat(player.payingFee) || 0;
        const pendingFee = parseFloat(player.pendingFee) || 0;
        const lastPaymentDate = pmts.length > 0 ? pmts[0].paymentDate : '—';
        const paymentMethod = pmts.length > 0 ? pmts[0].paymentMethod : '—';

        // 1.3 Experience
        // Check if player has left
        const archive = await PlayerArchive.findOne({ playerId: player.playerId }).lean();
        const endDate = (player.status === 'Left Academy' && archive) ? archive.leavingDate : null;
        const experience = calculateExperience(player.joiningDate, endDate);

        // 1.4 Print History
        const printHistory = await PrintHistory.find({ playerId: player.playerId }).lean().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                attendance: {
                    total: totalAtt,
                    present: presentAtt,
                    absent: absentAtt,
                    percentage: percentageAtt,
                    lastAttendance: lastAtt
                },
                payment: {
                    totalFee,
                    paid: paidFee,
                    pending: pendingFee,
                    lastPaymentDate,
                    paymentMethod
                },
                experience: {
                    joiningDate: player.joiningDate,
                    experienceMonths: experience.months,
                    experienceString: experience.str
                },
                archive: archive ? {
                    leavingDate: archive.leavingDate,
                    reasonForLeaving: archive.reasonForLeaving,
                    remarks: archive.remarks
                } : null,
                printHistory
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 2. Log print event
router.post('/players/print-history', auth, async (req, res) => {
    try {
        const { playerId, reason } = req.body;
        const player = await players.findById(playerId);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

        const today = new Date();
        const printDate = today.toISOString().split('T')[0];
        const printTime = today.toTimeString().split(' ')[0];

        let record = await PrintHistory.findOne({ playerId: player.playerId, printedBy: req.currentEmp._id });
        if (record) {
            record.printCount += 1;
            record.printDate = printDate;
            record.printTime = printTime;
            if (reason) record.reason = reason;
            await record.save();
        } else {
            record = new PrintHistory({
                playerId: player.playerId,
                playerName: player.fullName,
                printedBy: req.currentEmp._id,
                role: req.userRole,
                printDate,
                printTime,
                reason: reason || 'Registration Form Print',
                printCount: 1
            });
            await record.save();
        }

        res.status(200).json({ success: true, data: record });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 3. Mark player as left
router.put('/players/leave/:id', auth, auth.allowRoles('superadmin', 'admin'), async (req, res) => {
    try {
        const { leavingDate, reasonForLeaving, remarks } = req.body;
        if (!leavingDate || !reasonForLeaving) {
            return res.status(400).json({ success: false, message: 'Leaving date and reason are required' });
        }

        const filter = req.userRole === 'superadmin' ? { _id: req.params.id } : { _id: req.params.id, owner: req.academyOwnerId };
        const player = await players.findOne(filter);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found or unauthorized' });

        // Calculate final details for snapshot
        const atts = await Attendance.find({ playerId: player._id.toString() }).lean();
        const totalAtt = atts.length;
        const presentAtt = atts.filter(a => a.status.toLowerCase() === 'present').length;
        const absentAtt = atts.filter(a => a.status.toLowerCase() === 'absent').length;
        const percentageAtt = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

        const pmts = await Payment.find({ playerId: player.playerId }).lean();
        const totalFee = parseFloat(player.totalFee) || 0;
        const paidFee = parseFloat(player.payingFee) || 0;
        const pendingFee = parseFloat(player.pendingFee) || 0;

        const experience = calculateExperience(player.joiningDate, leavingDate);

        // Update status of Player to 'Left Academy'
        player.status = 'Left Academy';
        await player.save();

        let archive = await PlayerArchive.findOne({ playerId: player.playerId });
        if (!archive) {
            archive = new PlayerArchive({
                playerId: player.playerId,
                registrationNumber: player.playerId,
                academyId: player.owner,
                playerSnapshot: player.toObject(),
                joiningDate: player.joiningDate,
                leavingDate,
                academyExperienceMonths: experience.months,
                attendanceCount: {
                    total: totalAtt,
                    present: presentAtt,
                    absent: absentAtt,
                    percentage: percentageAtt
                },
                paymentSummary: {
                    totalFee,
                    paid: paidFee,
                    pending: pendingFee
                },
                reasonForLeaving,
                remarks: remarks || '',
                createdBy: req.currentEmp._id
            });
        } else {
            archive.leavingDate = leavingDate;
            archive.academyExperienceMonths = experience.months;
            archive.attendanceCount = {
                total: totalAtt,
                present: presentAtt,
                absent: absentAtt,
                percentage: percentageAtt
            };
            archive.paymentSummary = {
                totalFee,
                paid: paidFee,
                pending: pendingFee
            };
            archive.reasonForLeaving = reasonForLeaving;
            archive.remarks = remarks || '';
            archive.playerSnapshot = player.toObject();
        }
        await archive.save();

        createAuditLog({
            actor: req.currentEmp._id,
            action: 'update',
            collectionName: 'players',
            recordId: player._id.toString(),
            message: `Player ${player.fullName} marked as Left Academy`,
            metadata: { playerId: player.playerId, leavingDate, reasonForLeaving }
        });

        res.status(200).json({ success: true, message: 'Player marked as Left Academy and archived successfully', data: player });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;
