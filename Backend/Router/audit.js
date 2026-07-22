const express = require('express')
const router = new express.Router()
const auth = require('../Authentication/auth')
const AuditLog = require('../Model/auditLog')

router.get('/audit/report', auth, async (req, res) => {
    try {
        const isPrivileged = ['superadmin', 'admin'].includes(req.currentEmp.role || 'admin')
        const query = isPrivileged ? {} : { actor: req.currentEmp._id }
        const auditLogs = await AuditLog.find(query).lean()
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('actor', 'name email role')

        res.status(200).json({
            success: true,
            message: 'Audit log report fetched successfully',
            data: auditLogs,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit log report',
            error: error.message,
        })
    }
})

module.exports = router