const express = require('express')
const router = new express.Router()
const auth = require('../Authentication/auth')
const players = require('../Model/players')
const attendance = require('../Model/attendance')
const { createAuditLog } = require('../Utils/audit')

router.get('/attendance/report', auth, async (req, res) => {
    try {
        let filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        if (req.userRole === 'coach') {
            if (!req.coachProfile) return res.status(403).json({ success: false, message: 'Coach profile not found' });
            const myPlayers = await require('../Model/players').find({ owner: req.academyOwnerId, coachAssigned: req.coachProfile.name }, '_id').lean();
            filter.playerId = { $in: myPlayers.map(p => p._id.toString()) };
        }
        const records = await attendance.find(filter).lean().sort({ attendanceDate: -1, createdAt: -1 })
        res.status(200).json({
            success: true,
            message: 'Attendance report fetched successfully',
            data: records
        })
    } catch (e) {
        res.status(400).json({
            success: false,
            message: 'Failed to fetch attendance report',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

router.get('/attendance/players', auth, async (req, res) => {
    try {
        let filter = req.userRole === 'superadmin' ? {} : { owner: req.academyOwnerId };
        if (req.userRole === 'coach') {
            if (!req.coachProfile) return res.status(403).json({ success: false, message: 'Coach profile not found' });
            filter.coachAssigned = req.coachProfile.name;
        }
        const playerList = await players.find(filter).lean().sort({ fullName: 1 })
        res.status(200).json({
            success: true,
            message: 'Attendance players fetched successfully',
            data: playerList
        })
    } catch (e) {
        res.status(400).json({
            success: false,
            message: 'Failed to fetch attendance players',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

router.post('/attendance/mark', auth, auth.allowRoles('superadmin', 'admin', 'coach'), async (req, res) => {
    try {
        const playerId = String(req.body.playerId || '').trim()
        const attendanceDate = String(req.body.attendanceDate || '').trim()
        const status = String(req.body.status || '').trim().toLowerCase()
        const note = String(req.body.note || '').trim()

        if (!playerId || !attendanceDate || !status) {
            return res.status(400).json({
                success: false,
                message: 'Player, date and status are required'
            })
        }

        const filter = req.userRole === 'superadmin' ? { _id: playerId } : { _id: playerId, owner: req.academyOwnerId };
        if (req.userRole === 'coach') {
            if (!req.coachProfile) return res.status(403).json({ success: false, message: 'Coach profile not found' });
            filter.coachAssigned = req.coachProfile.name;
        }
        const player = await players.findOne(filter)
        if (!player) {
            return res.status(404).json({
                success: false,
                message: 'Player not found'
            })
        }

        const allowedStatuses = ['present', 'absent', 'late', 'excused']
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid attendance status'
            })
        }

        const recordFilter = req.userRole === 'superadmin' 
            ? { playerId: player._id.toString(), attendanceDate }
            : { owner: req.academyOwnerId, playerId: player._id.toString(), attendanceDate };

        const roleTitle = req.currentEmp.role.charAt(0).toUpperCase() + req.currentEmp.role.slice(1);
        const markedBy = `${roleTitle} (${req.currentEmp.name})`;

        const record = await attendance.findOneAndUpdate(
            recordFilter,
            {
                playerId: player._id.toString(),
                playerName: player.fullName,
                attendanceDate,
                status,
                note,
                markedBy,
                owner: recordFilter.owner || player.owner,
            },
            { new: true, upsert: true, runValidators: true }
        )

        createAuditLog({
            actor: req.currentEmp._id,
            action: 'create',
            collectionName: 'attendance',
            recordId: record._id.toString(),
            message: `Attendance marked as ${status} for ${player.fullName}`,
            metadata: { playerId: player.playerId, playerName: player.fullName, attendanceDate, status },
        })

        res.status(200).json({
            success: true,
            message: 'Attendance saved successfully',
            data: record
        })
    } catch (e) {
        res.status(400).json({
            success: false,
            message: 'Failed to save attendance',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

router.delete('/attendance/delete/:id', auth, auth.allowRoles('superadmin', 'admin', 'coach'), async (req, res) => {
    try {
        const filter = ['superadmin', 'coach'].includes(req.userRole) 
            ? { _id: req.params.id }
            : { _id: req.params.id, owner: req.academyOwnerId };

        if (req.userRole === 'coach') {
            if (!req.coachProfile) return res.status(403).json({ success: false, message: 'Coach profile not found' });
            const myPlayers = await require('../Model/players').find({ owner: req.academyOwnerId, coachAssigned: req.coachProfile.name }, '_id').lean();
            filter.playerId = { $in: myPlayers.map(p => p._id.toString()) };
        }

        const remove = await attendance.findOneAndDelete(filter)

        if (remove) {
            createAuditLog({
                actor: req.currentEmp._id,
                action: 'delete',
                collectionName: 'attendance',
                recordId: remove._id.toString(),
                message: 'Attendance record deleted',
                metadata: { playerId: remove.playerId, attendanceDate: remove.attendanceDate, status: remove.status },
            })
            return res.status(200).json({
                success: true,
                message: 'Attendance deleted successfully'
            })
        }

        res.status(404).json({
            success: false,
            message: 'Attendance record not found'
        })
    } catch (e) {
        res.status(400).json({
            success: false,
            message: 'Failed to delete attendance',
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : e.message
        })
    }
})

module.exports = router