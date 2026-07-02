const AuditLog = require('../Model/auditLog')

async function createAuditLog({ actor, action, collectionName, recordId = null, message = '', metadata = {} }) {
    try {
        await AuditLog.create({
            actor,
            action,
            collectionName,
            recordId,
            message,
            metadata,
        })
    } catch (error) {
        console.error('Audit log error:', error.message)
    }
}

module.exports = { createAuditLog }