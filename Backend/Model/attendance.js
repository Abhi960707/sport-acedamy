const mongoose = require('mongoose')

const attendanceSchema = mongoose.Schema({
    playerId: {
        type: String,
        required: true,
    },
    playerName: {
        type: String,
        required: true,
    },
    attendanceDate: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['present', 'absent', 'late', 'excused'],
    },
    note: {
        type: String,
        default: '',
    },
    markedBy: {
        type: String,
        default: '',
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Login'
    },
    updatedBy: {
        type: String,
        default: ''
    }
}, { timestamps: true })

attendanceSchema.index({ owner: 1, playerId: 1, attendanceDate: -1 });

attendanceSchema.index({ playerId: 1 });
attendanceSchema.index({ attendanceDate: -1 });

const attendance = mongoose.model('attendance', attendanceSchema)
module.exports = attendance