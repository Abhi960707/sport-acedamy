const mongoose = require('mongoose');

const playerArchiveSchema = new mongoose.Schema({
    playerId: {
        type: String,
        required: true
    },
    registrationNumber: {
        type: String
    },
    academyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Login',
        required: true
    },
    playerSnapshot: {
        type: Object,
        required: true
    },
    joiningDate: {
        type: String
    },
    leavingDate: {
        type: String
    },
    academyExperienceMonths: {
        type: Number
    },
    attendanceCount: {
        total: { type: Number, default: 0 },
        present: { type: Number, default: 0 },
        absent: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 }
    },
    paymentSummary: {
        totalFee: { type: Number, default: 0 },
        paid: { type: Number, default: 0 },
        pending: { type: Number, default: 0 }
    },
    reasonForLeaving: {
        type: String
    },
    remarks: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Login'
    }
}, { timestamps: true });

module.exports = mongoose.model('PlayerArchive', playerArchiveSchema);
