const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Login',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: ['login', 'logout', 'create', 'update', 'delete'],
    },
    collectionName: {
        type: String,
        required: true,
    },
    recordId: {
        type: String,
        default: null,
    },
    message: {
        type: String,
        default: '',
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
})

const AuditLog = mongoose.model('AuditLog', auditLogSchema)

module.exports = AuditLog